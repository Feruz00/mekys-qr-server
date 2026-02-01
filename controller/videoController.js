// controllers/video.controller.js
const { QrCodes, Files } = require('../models');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const openVideoByQr = catchAsync(async (req, res, next) => {
  const { id } = req.params; // qrCode id

  const qr = await QrCodes.findByPk(id, {
    include: [{ model: Files, as: 'file' }],
  });

  if (!qr || !qr.file) {
    return next(new AppError('Video not found', 404));
  }

  // ✅ COUNT VIEW (ONCE)
  await qr.increment('count');

  // ✅ Redirect to stream
  return res.redirect(`/api/stream/${qr.file.id}`);
});

module.exports = { openVideoByQr };
