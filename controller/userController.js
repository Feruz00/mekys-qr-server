const { Users } = require('../models');
const AppError = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const createUser = catchAsync(async (req, res, next) => {
  const { username, password, qr_limit, status } = req.body;
  if (!username || !password) {
    return next(new AppError('Username and password are required fields', 400));
  }
  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await Users.create({
    username,
    password: hashedPassword,
    qr_limit,
    status,
  });
  return res.json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const { username, status, password, qr_limit } = req.body;
  const user = await Users.findByPk(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  if (username) user.username = username;
  if (password) {
    user.password = await bcrypt.hash(password, 12);
  }
  if (qr_limit) user.qr_limit = qr_limit;
  if (status) user.status = status;

  await user.save();
  return res.json({
    status: 'success',
    data: {
      user,
    },
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const user = await Users.findByPk(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  if (user.id === req.user.id) {
    return next(new AppError('You cannot delete your own account', 403));
  }
  const qrCodes = await user.getQrcodes();
  for (const qrCode of qrCodes) {
    const filePath = path.join(__dirname, '..', qrCode.path);
    await qrCode.destroy();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  await user.destroy();
  return res.json({
    status: 'success',
    message: 'User deleted successfully',
  });
});

const deleteUsers = catchAsync(async (req, res, next) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(
      new AppError('Please provide an array of user IDs to delete', 400)
    );
  }

  let newIds = ids.filter((id) => id !== req.user.id);

  const deletePromises = newIds.map(async (id) => {
    const user = await Users.findByPk(id);
    if (user) {
      const qrCodes = await user.getQrcodes();
      for (const qrCode of qrCodes) {
        const filePath = path.join(__dirname, '..', qrCode.path);
        await qrCode.destroy();
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      await user.destroy();
    }
  });

  await Promise.all(deletePromises);

  return res.json({
    status: 'success',
    message: 'Users deleted successfully',
  });
});

const getUsers = catchAsync(async (req, res, next) => {
  const { limit = 10, page = 1, sort, order, username } = req.query;

  const queryOptions = {
    where: {},
    order: [['id', 'desc']],
    offset: (page - 1) * limit,
    limit: parseInt(limit, 10),
    attributes: { exclude: ['password'] },
  };

  if (limit && page) {
    queryOptions.limit = parseInt(limit, 10);
    queryOptions.offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  }
  if (sort && order) {
    queryOptions.order = [[sort, order.toUpperCase()]];
  }
  if (username) {
    queryOptions.where.username = {
      [Op.like]: `%${username}%`,
    };
  }
  const { count, rows } = await Users.findAndCountAll(queryOptions);

  const ids = rows.map((row) => row.id);
  let data = await Users.findAll({
    where: {
      id: ids,
    },
    include: ['qrcodes'],
  });

  data = data
    .map((row) => row.toJSON())
    .map((row) => ({ ...row, used: row.qrcodes.length, qrcodes: undefined }));
  return res.json({
    data: data,
    count,
  });
});

const getUser = catchAsync(async (req, res, next) => {
  const user = await Users.findByPk(req.params.id, {
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
  createUser,
  updateUser,
  deleteUser,
  getUsers,
  getUser,
  deleteUsers,
};
