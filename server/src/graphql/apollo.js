const { ApolloServer, gql, UserInputError } = require('apollo-server');
const { User, OnlineStat, ActiveUserStatSnapshot } = require('../db');
const sequelize = require('sequelize');

const typeDefs = gql`
  type PageInfo {
    total: Int
    limit: Int
    offset: Int
  }

  interface Pagination {
    pageInfo: PageInfo
  }

  type User {
    username: String
    name: String
    photoUrl: String
    bio: String
  }

  type OnlineStat {
    place: Int
    minutes: Int
    user: User
    date: Int
  }

  type OnlineRankingStats implements Pagination {
    entries: [OnlineStat]
    pageInfo: PageInfo
  }

  type ActiveUserStat {
    amount: Int
    date: Int
  }

  type Query {
    onlineRankingStats(
      start: Int
      end: Int
      limit: Int
      offset: Int
    ): OnlineRankingStats
    activeUserStats(start: Int, end: Int, level: String): [ActiveUserStat]
  }
`;

const validateArgs = (args) => {
  if (args.start && args.end) {
    if (args.end < args.start) {
      return false;
    }
  }

  if (args.limit && args.limit < 0) {
    return false;
  }

  if (args.offset && args.offset < 0) {
    return false;
  }

  return true;
};

const fetchOnlineRankingStats = async (parent, args) => {
  if (!validateArgs(args)) {
    throw new UserInputError('Invalid argument value');
  }

  const limit = Math.min(args.limit, 100);
  const conditions = {
    where: {
      date: {
        [sequelize.Op.between]: [args.start, args.end],
      },
    },
    order: [
      ['minutes', 'DESC'],
      ['user_id', 'ASC'],
    ],
    limit,
    offset: args.offset,
    include: User,
  };

  let onlineStatsTotalAmount = 0;
  let onlineStatsEntries = [];

  try {
    onlineStatsTotalAmount = await OnlineStat.count(conditions);
    onlineStatsEntries = (await OnlineStat.findAll(conditions)).map(
      (stat, index) => {
        const user = stat.clubhouse_user;
        return {
          place: args.offset + index + 1,
          minutes: stat.minutes,
          date: stat.date,
          user: user
            ? {
                username: user.username,
                name: user.name,
                photoUrl: user.photo_url,
                bio: user.bio,
              }
            : null,
        };
      }
    );
  } catch (error) {
    console.error(error);
  }

  return {
    entries: onlineStatsEntries,
    pageInfo: {
      total: onlineStatsTotalAmount,
      limit,
      offset: args.offset,
    },
  };
};

const fetchActiveUserStats = async (parent, args) => {
  if (!validateArgs(args)) {
    throw new UserInputError('Invalid argument value');
  }

  const conditions = {
    attributes: ['amount', 'date'],
    where: {
      date: {
        [sequelize.Op.between]: [args.start, args.end],
      },
    },
    order: [['date', 'ASC']],
  };

  let activeUserStatEntries = [];

  try {
    activeUserStatEntries = await ActiveUserStatSnapshot.findAll(conditions);
  } catch (error) {
    console.error(error);
  }

  return activeUserStatEntries;
};

const resolvers = {
  Query: {
    onlineRankingStats: fetchOnlineRankingStats,
    activeUserStats: fetchActiveUserStats,
  },
};

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  debug: !!process.env.DEBUG,
});

module.exports = {
  apolloServer,
};
