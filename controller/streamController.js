const fs = require('fs');
const path = require('path');
const { Files, QrCodes, QrView } = require('../models');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const VIEW_COOLDOWN_MINUTES = 10;

const streamController = catchAsync(async (req, res, next) => {
  // ✅ Get file metadata
  const file = await Files.findByPk(req.params.id);
  if (!file) return next(new AppError('File not found', 404));

  const absolutePath = path.resolve(decodeURIComponent(file.path));

  let stat;
  try {
    stat = await fs.promises.stat(absolutePath);
  } catch {
    return next(new AppError('File missing from disk', 404));
  }

  const fileSize = stat.size;
  const mimeType = file.mimetype || 'video/mp4';
  const range = req.headers.range;
  const qrId = req.query.qr;

  // ✅ Do NOT let DB slow streaming
  if (range?.startsWith('bytes=0') && qrId) {
    setImmediate(() => countView(qrId, req));
  }

  // ✅ Required headers
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');

  // 🔥 IMPORTANT — improves playback massively
  res.setHeader('Cache-Control', 'public, max-age=86400');

  // ------------------------------------------------
  // NO RANGE → send full file
  // ------------------------------------------------
  if (!range) {
    res.writeHead(200, {
      'Content-Length': fileSize,
    });

    const stream = fs.createReadStream(absolutePath);

    stream.on('error', () => res.end());
    stream.pipe(res);

    return;
  }

  // ------------------------------------------------
  // RANGE REQUEST
  // ------------------------------------------------

  const parts = range.replace(/bytes=/, '').split('-');

  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

  // safety check
  if (start >= fileSize || end >= fileSize) {
    res.status(416).send('Requested range not satisfiable');
    return;
  }

  const chunkSize = end - start + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Content-Length': chunkSize,
  });

  const stream = fs.createReadStream(absolutePath, { start, end });

  stream.on('error', () => res.end());
  stream.pipe(res);
});

// ✅ DB counter isolated from streaming
async function countView(qrId, req) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const cooldownDate = new Date(
      Date.now() - VIEW_COOLDOWN_MINUTES * 60 * 1000
    );

    const exists = await QrView.findOne({
      where: {
        qrId,
        ip,
        createdAt: { [Op.gt]: cooldownDate },
      },
    });

    if (exists) return;

    await Promise.all([
      QrCodes.increment('count', { where: { id: qrId } }),
      QrView.create({ qrId, ip }),
    ]);
  } catch (err) {
    console.error('View count error:', err);
  }
}

module.exports = { streamController };
