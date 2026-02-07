const { login, currentUser, logout } = require('../controller/authController');
const { protect } = require('../middleware/jwt');
const authRateLimiter = require('../middleware/rate-limitter');

const router = require('express').Router();

router.get('/', protect, currentUser);
router.post('/login', authRateLimiter, login);
router.post('/logout', protect, logout);

module.exports = router;
