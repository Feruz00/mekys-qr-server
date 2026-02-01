const {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  deleteUsers,
} = require('../controller/userController');
const { protect, restrictTo } = require('../middleware/jwt');

const router = require('express').Router();

router.use(protect, restrictTo('admin'));

router.route('/').get(getUsers).post(createUser).delete(deleteUsers);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
