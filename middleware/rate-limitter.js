const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../redis');

const authRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args), // ioredis uses .call()
    prefix: 'rate-limit:auth:',
  }),

  windowMs: 10 * 60 * 1000, // 10 minutesnpm run
  max: 5, // limit each IP to 5 requests per window

  message: {
    message:
      'Too many login attempts from this IP. Please try again after 10 minutes.',
  },

  handler: (req, res) => {
    console.log('BLOCKED IP:', req.ip);
    res.status(429).json({
      message: 'Too many login attempts. Try again later.',
    });
  },
});

module.exports = authRateLimiter;
