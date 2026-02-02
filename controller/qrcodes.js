const { catchAsync } = require('../utils/catchAsync');
const { Files, QrCodes } = require('../models');
const AppError = require('../utils/appError');
const path = require('path');
const fs = require('fs');

const uploadFile = catchAsync(async (req, res, next) => {
  const { fileId } = req.body;
  if (!fileId) {
    return next(new AppError('FileId required', 400));
  }

  const file = await Files.findByPk(fileId);

  if (!file) {
    return next(new AppError('File not found', 404));
  }
  const qr = await QrCodes.create({
    user_id: req.user.id,
    count: 0,
  });
  await qr.setFile(file);
  return res.json({ success: true });
});
const getFiles = catchAsync(async (req, res, next) => {
  const { limit = 10, page = 1 } = req.query;

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

  const { count, rows } = await QrCodes.findAndCountAll(queryOptions);
  const ids = rows.map((row) => row.id);
  const data = await QrCodes.findAll({
    where: {
      id: ids,
    },
    order: queryOptions.order,
    include: ['file'],
  });
  return res.json({
    data: data,
    count,
  });
});
const getFile = catchAsync(async (req, res, next) => {});

const deleteFile = catchAsync(async (req, res, next) => {
  const code = await QrCodes.findByPk(req.params.id);
  if (!code) {
    return next(new AppError('QrCode not found', 404));
  }

  const file = await code.getFile();
  if (file) {
    const filePath = path.join(__dirname, '..', file.path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await file.destroy();
  }
  await code.destroy();

  return res.json({
    status: 'success',
    message: 'User deleted successfully',
  });
});

const deleteFiles = catchAsync(async (req, res, next) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(
      new AppError('Please provide an array of user IDs to delete', 400)
    );
  }

  const deletePromises = ids.map(async (id) => {
    const code = await QrCodes.findByPk(id);
    if (code && code.user_id === req.user.id) {
      const file = await code.getFile();
      if (file) {
        const filePath = path.join(__dirname, '..', file.path);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await file.destroy();
      }
      await code.destroy();
    }
  });

  await Promise.all(deletePromises);

  return res.json({
    status: 'success',
    message: 'Users deleted successfully',
  });
});
const updateFile = catchAsync(async (req, res, next) => {});

module.exports = {
  uploadFile,
  getFiles,
  getFile,
  deleteFile,
  updateFile,
  deleteFiles,
};
