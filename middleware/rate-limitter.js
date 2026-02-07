const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    console.log('BLOCKED IP:', req.ip);

    res.status(429).json({
      message: 'Too many login attempts. Try again later.',
    });
  },
});

module.exports = authRateLimiter;
