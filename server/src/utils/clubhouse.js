require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('clubhouse-api');
const { delay } = require('./delay');

const profile = {};
const profileLoc = path.join(__dirname, '../../profile-example.json');
let ctx = false;

if (fs.existsSync(profileLoc)) {
  ctx = JSON.parse(fs.readFileSync(profileLoc));

  profile.token = ctx.tokens.auth;
  profile.userId = ctx.user.user_id;
  profile.deviceId = ctx.deviceId;
}

const app = new Client({ profile });

let TARGET_CHANNEL = null;

const filterChannel = async () => {
  app.debug('###### Filtering Channel...');

  let matchedChannel;
  try {
    const channels = await app.getChannels();
    matchedChannel = channels.channels.find((channel) => {
      const clubId = (channel.club && channel.club.club_id) || 0;
      const clubMatched = process.env.CLUB_ID === clubId;
      return clubMatched;
    });

    return matchedChannel && matchedChannel.channel;
  } catch (error) {
    app.debug(error);
  }

  return matchedChannel;
};

const fetchChannelUsers = async () => {
  app.debug(await app.checkForUpdate());

  if (!ctx) {
    return;
  }

  if (!TARGET_CHANNEL) {
    TARGET_CHANNEL = await filterChannel();
    await delay(2000);
  }

  if (!TARGET_CHANNEL) {
    app.debug('###### No matched channel');
    return [];
  }

  app.debug('###### Fetching channel detail...');

  let matchedChannel;

  try {
    matchedChannel = await app.joinChannel({
      attribution_source: null,
      attribution_details: null,
      channel: TARGET_CHANNEL,
    });
  } catch (error) {
    app.debug('###### Fetching channel error...');
    app.debug(error);
  }

  if (
    !matchedChannel ||
    !matchedChannel.users ||
    !matchedChannel.users.length
  ) {
    TARGET_CHANNEL = null;
    return [];
  }

  app.debug(`###### ${matchedChannel.users.length} users in channel ATM...`);

  return matchedChannel.users;
};

const fetchUser = async (userId) => {
  let user = null;
  try {
    const result = await app.getUser(userId);
    user = result.user_profile;
  } catch (error) {
    console.error(error);
  }
  return user;
};

module.exports = {
  app,
  fetchChannelUsers,
  fetchUser,
};
