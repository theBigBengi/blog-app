const mongoose = require("mongoose");
const redis = require("redis");
const redisclient = redis.createClient();

// Connect to redis
(async () => {
  await redisclient.connect();
})();

redisclient.on("ready", () => {
  console.log("Connected to Redis");
});

redisclient.on("error", (err) => {
  console.log("Error in the Connection", err);
});

// Add caching
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || ""); // Key for hashing Must be a string

  return this; // Return 'this' for chaining
};

// Store the original exec function before hijacking it
const exec = mongoose.Query.prototype.exec;

// Monkey patch mongoose's exec function
mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  // Check for value for the key in redis
  const cachedData = await redisclient.hGet(this.hashKey, key);

  // If we do, return it
  if (cachedData) {
    const doc = JSON.parse(cachedData);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  // Otherwise issue the query and store the result in reedis
  const result = await exec.apply(this, arguments);
  await redisclient.hSet(this.hashKey, key, JSON.stringify(result));
  await redisclient.expire(this.hashKey, 60);
  return result;
};

module.exports = {
  clearCache: async function (hashKey) {
    await redisclient.del(JSON.stringify(hashKey));
  },
};
