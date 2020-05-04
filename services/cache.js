const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const config = require('../config/keys');


const CACHE_EXPIRATION = 24 * 60 * 60; // one day
const client = redis.createClient(config.redisUrl);

client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this._cache = true;
  this.hashKey = JSON.stringify(options.key || '');
  return this;
}

mongoose.Query.prototype.exec = async function () {
  try {
    if (!this._cache) {
      return exec.apply(this, arguments);
    }
  
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    }));
  
    const cacheValue = await client.hget(this.hashKey, key);
    if (cacheValue) {
      const doc = JSON.parse(cacheValue);
      return Array.isArray(doc)
        ? doc.map(d => new this.model(d))
        : new this.model(doc);
    }
  
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result), 'EX', CACHE_EXPIRATION);

    return result;
  } catch (error) {
    return exec.apply(this, arguments);
  }
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
}
