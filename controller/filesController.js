const { Files, QrCodes } = require('../models');
const fs = require('fs/promises');
const path = require('path');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const count = await QrCodes.count({ where: { user_id: req.user.id } });

  if (count === req.user.qr_limit) {
    const absolutePath = req.file.path;
    try {
      if (absolutePath)
        await fs.unlink(absolutePath).catch((err) => {
          if (err.code !== 'ENOENT') throw err;
        });
    } catch (err) {
      console.error('Failed to delete file(s):', err);
      return next(new AppError('Error deleting file from disk', 400));
    }
    return res.status(400).json({ error: ' Limit exucation' });
  }

  let { size, mimetype, path: filePath } = req.file;
  const encodedFilename = Buffer.from(req.file.originalname, 'latin1')
    .toString('utf8')
    .split(' ')
    .join('_');

  let smallImagePath = null;

  const file = await Files.create({
    originalName: encodedFilename,
    size,
    mimetype,
    path: filePath,
    small_path: smallImagePath,
  });

  res.json(file);
});

const deleteFile = catchAsync(async (req, res, next) => {
  const file = await Files.findByPk(req.params.id);

  if (!file) {
    return next(new AppError('File not found', 404));
  }
  const absolutePath = file.path;

  await file.destroy();
  try {
    if (absolutePath)
      await fs.unlink(absolutePath).catch((err) => {
        if (err.code !== 'ENOENT') throw err;
      });
  } catch (err) {
    console.error('Failed to delete file(s):', err);
    return next(new AppError('Error deleting file from disk', 500));
  }
  return res.json({ status: 'success', message: 'File deleted successfully' });
});

module.exports = {
  uploadFile,
  deleteFile,
};
