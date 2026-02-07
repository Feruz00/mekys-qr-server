const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes

  max: 5,
  // 👉 Only 5 login attempts per IP in 10 minutes

  message: {
    status: 429,
    message: 'Too many login attempts. Try again in 10 minutes.',
  },

  standardHeaders: true,
  legacyHeaders: false,

  // Count ONLY failed requests (VERY SMART)
  skipSuccessfulRequests: true,
});

module.exports = authRateLimiter;
