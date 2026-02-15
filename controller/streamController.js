const fs = require('fs');
const path = require('path');
const { Files, QrCodes, QrView } = require('../models');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const VIEW_COOLDOWN_MINUTES = 10;

const MAX_CHUNK_SIZE = 1024 * 1024;
const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.m4v': 'video/x-m4v',
  '.flv': 'video/x-flv',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.ogv': 'video/ogg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

const streamController = async (req, res, next) => {
  // ✅ Get file metadata

  try {
    const file = await Files.findOne({
      where: {
        id: req.params.id,
      },
    });
    if (!file) return next(new AppError('File not found', 404));

    const absolutePath = path.resolve(decodeURIComponent(file.path));
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const stat = fs.statSync(absolutePath);
    const fileSize = stat.size;

    const mimeType = file.mimetype || 'video/mp4';
    const range = req.headers.range;
    const qrId = req.query.qr;

    // ✅ Do NOT let DB slow streaming
    if (range?.startsWith('bytes=0') && qrId) {
      setImmediate(() => countView(qrId, req));
    }

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', mimeType);

    // ------------------------------------------------
    // NO RANGE → send full file
    // ------------------------------------------------

    if (range) {
      // Parse range
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // FIX 1: If no end given (bytes=0-), send from start to end of file
      if (isNaN(end) || end < start) {
        end = fileSize - 1;
      }

      // FIX 2: Never go beyond file size
      if (end >= fileSize) end = fileSize - 1;

      const chunkSize = end - start + 1;

      console.log(
        `[Stream] Serving range ${start}-${end}/${fileSize} (${chunkSize} bytes)`
      );

      const fileStream = fs.createReadStream(absolutePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
      });

      fileStream.pipe(res);
    } else {
      // Full file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      });

      fs.createReadStream(absolutePath).pipe(res);
    }
  } catch (error) {
    console.error('Streaming error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
