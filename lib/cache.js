const { Redis } = require('@upstash/redis');

let redis = null;
function getRedis() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      redis = new Redis({
        url,
        token
      });
    }
  }
  return redis;
}

async function getCache(key) {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const data = await redis.get(key);
    return data;
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
}

async function setCache(key, value, ttlSeconds) {
  try {
    const redis = getRedis();
    if (!redis) return null;
    await redis.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (err) {
    console.error('Cache set error:', err);
    return null;
  }
}

module.exports = { getCache, setCache };