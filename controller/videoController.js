// controllers/video.controller.js
const { QrCodes, Files } = require('../models');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { streamController } = require('./streamController');

const openVideoByQr = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const qr = await QrCodes.findByPk(id, {
    include: [{ model: Files, as: 'file' }],
  });

  if (!qr || !qr.file) {
    return next(new AppError('Media not found', 404));
  }

  // console.log(qr.file.id);

  req.params.id = qr.file.id;
  req.query.qr = qr.id;

  return streamController(req, res, next);
});

module.exports = { openVideoByQr };
