const SECONDS_PER_DAY = 86400;

const getTodayStartTimestamp = () => {
  return (
    Math.floor(new Date().getTime() / (SECONDS_PER_DAY * 1000)) *
    SECONDS_PER_DAY
  );
};

const getYesterdayStartTimestamp = () => {
  return getTodayStartTimestamp() - SECONDS_PER_DAY;
};

module.exports = {
  getTodayStartTimestamp,
  getYesterdayStartTimestamp,
};
