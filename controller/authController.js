const { Users } = require('../models');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const bcrypt = require('bcryptjs');

const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return next(new AppError('Username and password are required fields', 400));
  }

  const user = await Users.findOne({ where: { username } });
  if (!user) {
    return next(new AppError('Incorrect username or password', 401));
  }
  if (user.status === 'inactive') {
    return next(new AppError('Your account inactive', 401));
  }
  if (!(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Incorrect username or password', 401));
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('jwt', token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
  });
  return res.json({
    status: 'success',
    data: {
      token,
      user,
    },
  });
});

const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    maxAge: 10 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
  });
  return res.json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

const currentUser = catchAsync(async (req, res, next) => {
  const user = await Users.findByPk(req.user.id, {
    attributes: { exclude: ['password'] },
  });
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  return res.json({
    status: 'success',
    data: user,
  });
});
module.exports = {
  login,
  logout,
  currentUser,
};
