const fs = require('fs');
const path = require('path');
const { Files, QrCodes, QrView } = require('../models');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const MAX_CHUNK_SIZE = 1024 * 1024;
const VIEW_COOLDOWN_MINUTES = 10;

const streamController = catchAsync(async (req, res, next) => {
  const file = await Files.findByPk(req.params.id);
  if (!file) return next(new AppError('File not found', 404));

  const absolutePath = path.resolve(decodeURIComponent(file.path));

  if (!fs.existsSync(absolutePath)) {
    return next(new AppError('File missing from disk', 404));
  }

  const stat = fs.statSync(absolutePath);
  const fileSize = stat.size;
  const mimeType = file.mimetype || 'application/octet-stream';

  const range = req.headers.range;
  const qrId = req.query.qr;

  // ⭐ COUNT VIEW ONLY ON FIRST BYTE
  if (range?.startsWith('bytes=0') && qrId) {
    countView(qrId, req).catch(console.error);
  }

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'no-cache');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');

    const start = parseInt(parts[0], 10);
    let end = parts[1] ? parseInt(parts[1], 10) : start + MAX_CHUNK_SIZE - 1;

    if (isNaN(end) || end >= fileSize) {
      end = fileSize - 1;
    }

    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunkSize,
    });

    fs.createReadStream(absolutePath, {
      start,
      end,
      highWaterMark: MAX_CHUNK_SIZE,
    }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
    });

    fs.createReadStream(absolutePath).pipe(res);
  }
});

async function countView(qrId, req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const cooldownDate = new Date(Date.now() - VIEW_COOLDOWN_MINUTES * 60 * 1000);

  const exists = await QrView.findOne({
    where: {
      qrId,
      ip,
      createdAt: { [Op.gt]: cooldownDate },
    },
  });

  if (exists) return;

  // run in parallel
  await Promise.all([
    QrCodes.increment('count', { where: { id: qrId } }),
    QrView.create({ qrId, ip }),
  ]);
}

module.exports = { streamController };
