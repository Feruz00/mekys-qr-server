const AppError = require('../utils/appError');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { catchAsync } = require('./../utils/catchAsync');
const { Users } = require('../models');
const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    res.clearCookie('jwt');

    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    res.clearCookie('jwt');
    return next(
      new AppError('Token is invalid or expired. Please login again.', 401)
    );
  }

  const currentUser = await Users.findByPk(decoded.id, {
    attributes: {
      exclude: ['password'],
    },
  });

  if (!currentUser) {
    res.clearCookie('jwt');
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  let userData = await currentUser.toJSON();

  req.user = userData;

  return next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
