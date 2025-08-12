const Redis = require("ioredis");

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: "localhost",
      port: 6379,
      db: 6,
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
    });
    redisClient.on("error", (err) => {
      console.error("❌ Redis error:", err);
    });
  }

  return redisClient;
};

module.exports = {
  getRedisClient,
};
