// controllers/video.controller.js
const { QrCodes, Files } = require('../models');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const openVideoByQr = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const qr = await QrCodes.findByPk(id, {
    include: [{ model: Files, as: 'file' }],
  });

  if (!qr || !qr.file) {
    return next(new AppError('Media not found', 404));
  }

  console.log(qr.file.id);
  return res.redirect(`/api/stream/${qr.file.id}?qr=${qr.id}`);
});

module.exports = { openVideoByQr };
