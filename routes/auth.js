const { login, currentUser, logout } = require('../controller/authController');
const { protect } = require('../middleware/jwt');

const router = require('express').Router();

router.get('/', protect, currentUser);
router.post('/login', login);
router.post('/logout', protect, logout);

module.exports = router;
