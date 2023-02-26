process.env.DEBUG = '*';

// eslint-disable-next-line
require = require('esm')(module);
require('dotenv').config();

const schedule = require('node-schedule');
const { redis } = require('./src/redis');
const {
  sequelize,
  User,
  OnlineStat,
  ActiveUserStatSnapshot,
} = require('./src/db');
const { getTodayStartTimestamp } = require('./src/utils/date');
const { app, fetchChannelUsers, fetchUser } = require('./src/utils/clubhouse');
const { delay } = require('./src/utils/delay');

const REDIS_KEYS_STATIC = {
  TIMESTAMP_PREVIOUS: 'TIMESTAMP_PREVIOUS',
  TIMESTAMP_LAST_LOG: 'TIMESTAMP_LAST_LOG', // To record milli seconds
};

const REDIS_DATA_TYPES = {
  USERS: 'USERS',
  ONLINE_STATS: 'ONLINE_STATS',
};

const PROPERTIES_TO_SYNC = {
  USER: ['user_id', 'name', 'photo_url', 'username'],
};

const getRedisDataKey = (timestamp, type) => {
  return `${timestamp}-${type}`;
};

const getOnlineStats = async (timestamp) => {
  const keyOnlineStats = getRedisDataKey(
    timestamp,
    REDIS_DATA_TYPES.ONLINE_STATS
  );
  let onlineStats = await redis.get(keyOnlineStats);
  onlineStats = onlineStats ? JSON.parse(onlineStats) : {};
  return onlineStats;
};

const setOnlineStats = async (timestamp, onlineStats) => {
  const keyOnlineStats = getRedisDataKey(
    timestamp,
    REDIS_DATA_TYPES.ONLINE_STATS
  );
  redis.set(keyOnlineStats, JSON.stringify(onlineStats));
};

const getUsers = async (timestamp) => {
  const keyUsers = getRedisDataKey(timestamp, REDIS_DATA_TYPES.USERS);
  let users = await redis.get(keyUsers);
  users = users ? JSON.parse(users) : {};
  return users;
};

const setUsers = async (timestamp, users) => {
  const keyUsers = getRedisDataKey(timestamp, REDIS_DATA_TYPES.USERS);
  redis.set(keyUsers, JSON.stringify(users));
};

// Cache data to Redis
const cacheDataToRedis = async (timestamp, users) => {
  const cachedOnlineStats = await getOnlineStats(timestamp);
  const cachedUsers = await getUsers(timestamp);

  users.forEach((user) => {
    const userId = user.user_id;
    // Overwrite user with latest data
    cachedUsers[userId] = {
      user_id: user.user_id,
      name: user.name,
      photo_url: user.photo_url,
      username: user.username,
    };

    // Add up user's online duration
    const cachedOnlineStat = cachedOnlineStats[userId] || {
      user_id: userId,
      minutes: 0,
    };

    cachedOnlineStat.minutes += 1;
    cachedOnlineStats[userId] = cachedOnlineStat;
  });

  setUsers(timestamp, cachedUsers);
  setOnlineStats(timestamp, cachedOnlineStats);
};

// Clear Redis cache
const clearRedisCache = async (timestamp) => {
  const keyYesterdayUsers = getRedisDataKey(timestamp, REDIS_DATA_TYPES.USERS);
  const keyYesterdayOnlineStats = getRedisDataKey(
    timestamp,
    REDIS_DATA_TYPES.ONLINE_STATS
  );

  try {
    await redis.del(keyYesterdayUsers);
    await redis.del(keyYesterdayOnlineStats);
  } catch (error) {
    app.debug(error);
  }
};

// Save users to DB
const saveUsersToDB = async (timestamp) => {
  const cachedUsers = await getUsers(timestamp);
  const localCachedUsers = Object.values(cachedUsers);
  await updateUsers(localCachedUsers);
};

// Save online stats to DB
const saveOnlineStatsToDB = async (timestamp) => {
  const dbOnlineStats = await OnlineStat.findAll({
    where: {
      date: timestamp,
    },
  });

  const cachedOnlineStats = await getOnlineStats(timestamp);
  const localOnlineStats = dbOnlineStats.reduce((aggr, stat) => {
    aggr[stat.user_id] = stat;
    return aggr;
  }, {});
  const localCachedOnlineStats = Object.values(cachedOnlineStats);

  const onlineStatsToCreate = [];
  for (const localCachedOnlineStat of localCachedOnlineStats) {
    const cachedOnlineStatInDB =
      localOnlineStats[localCachedOnlineStat.user_id];
    if (cachedOnlineStatInDB) {
      cachedOnlineStatInDB.minutes = localCachedOnlineStat.minutes;
      try {
        await cachedOnlineStatInDB.save();
      } catch (error) {
        app.debug(error);
      }
    } else {
      const newOnlineStat = {
        user_id: localCachedOnlineStat.user_id,
        minutes: localCachedOnlineStat.minutes,
        date: timestamp,
      };
      onlineStatsToCreate.push(newOnlineStat);
    }
  }

  if (onlineStatsToCreate.length > 0) {
    try {
      await OnlineStat.bulkCreate(onlineStatsToCreate);
    } catch (error) {
      app.debug(error);
    }
  }
};

// Take snapshot for active users stats
const takeActiveUserStatsSnapshot = async (timestamp) => {
  const todayAmount =
    (await OnlineStat.count({
      where: {
        date: timestamp,
      },
    })) || 0;
  const snapshot = await ActiveUserStatSnapshot.findOne({
    where: {
      date: timestamp,
      level: 'daily',
    },
  });
  if (snapshot) {
    snapshot.amount = todayAmount || snapshot.amount;
    await snapshot.save();
  } else {
    await ActiveUserStatSnapshot.create({
      amount: todayAmount,
      date: timestamp,
      level: 'daily',
    });
  }
};

const updateUsers = async (users) => {
  if (!users || !users.length) {
    return;
  }

  const usersToCreate = [];
  for (const localCachedUser of users) {
    const userInDB = await User.findOne({
      where: {
        user_id: localCachedUser.user_id,
      },
    });
    if (userInDB) {
      PROPERTIES_TO_SYNC.USER.forEach((key) => {
        userInDB[key] = localCachedUser[key];
      });
      try {
        app.debug(`Updating user ${userInDB.user_id}`);
        await userInDB.save();
        await delay(100);
      } catch (error) {
        app.debug(error);
      }
    } else {
      const newUser = PROPERTIES_TO_SYNC.USER.reduce((aggr, key) => {
        aggr[key] = localCachedUser[key];
        return aggr;
      }, {});
      usersToCreate.push(newUser);
    }
  }

  app.debug(`${usersToCreate.length} new users to add`);
  if (usersToCreate.length > 0) {
    try {
      await User.bulkCreate(usersToCreate);
    } catch (error) {
      app.debug(error);
    }
  }
};

const saveDataToDB = async (timestamp) => {
  await saveOnlineStatsToDB(timestamp);
  await takeActiveUserStatsSnapshot(timestamp);
  await saveUsersToDB(timestamp);
};

const logChannelUsersJob = async () => {
  const timestampToday = getTodayStartTimestamp();
  const users = await fetchChannelUsers();
  if (users.length) {
    await cacheDataToRedis(timestampToday, users);
  }

  let timestampPrevious =
    (await redis.get(REDIS_KEYS_STATIC.TIMESTAMP_PREVIOUS)) || 0;
  timestampPrevious = parseInt(timestampPrevious);

  // const timestampLastLog = await redis.get(REDIS_KEYS_STATIC.TIMESTAMP_LAST_LOG) // To record milli seconds

  // Is previous date today?
  if (timestampPrevious === timestampToday) {
    return;
  }

  // Save data to DB
  await saveDataToDB(timestampPrevious);

  // Clear previous Redis cache
  await clearRedisCache(timestampPrevious);

  // Set previous timestamp
  await redis.set(REDIS_KEYS_STATIC.TIMESTAMP_PREVIOUS, timestampToday);
};

const syncUsersJob = async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT user_id,
            SUM(minutes) AS minutes
      FROM clubhouse_online_stats
      WHERE user_id NOT IN (
          SELECT user_id FROM clubhouse_users
      )
      GROUP BY user_id
      ORDER BY minutes DESC
      LIMIT 10`);

    const users = [];
    const userIds = results.map((item) => item.user_id);
    for (const userId of userIds) {
      const user = await fetchUser(userId);
      if (user) {
        users.push(user);
        await delay(5000);
      }
    }

    await updateUsers(users);
  } catch (error) {
    app.debug('Sync users job failed');
  }
};

const start = async () => {
  schedule.scheduleJob(
    process.env.SCHEDULE_JOB_LOG_CHANNEL_USERS,
    logChannelUsersJob
  );
  schedule.scheduleJob(process.env.SCHEDULE_JOB_SYNC_USERS, syncUsersJob);
};

start();
