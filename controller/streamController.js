const fs = require('fs');
const path = require('path');
const { Files } = require('../models'); // Adjust to your models location
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const MAX_CHUNK_SIZE = 1024 * 1024;
const streamController = catchAsync(async (req, res, next) => {
  // 1️⃣ Find file info in database
  const file = await Files.findByPk(req.params.id);
  if (!file) return next(new AppError('File not found', 404));

  try {
    const filePath = decodeURIComponent(file.path);
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(absolutePath);
    const fileSize = stat.size;

    // MIME type from query or fallback to video/mp4
    const mimeType = decodeURIComponent(file.mimetype || 'video/mp4');

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', mimeType);

    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : start + MAX_CHUNK_SIZE - 1;

      // Make sure end is within file bounds
      if (isNaN(end) || end < start || end >= fileSize) {
        end = fileSize - 1;
      }

      const chunkSize = end - start + 1;

      // Stream the chunk
      const fileStream = fs.createReadStream(absolutePath, {
        start,
        end,
        highWaterMark: MAX_CHUNK_SIZE,
      });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      });

      fileStream.pipe(res);
    } else {
      // Stream entire file (for small files or no range request)
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
      });

      fs.createReadStream(absolutePath, { highWaterMark: MAX_CHUNK_SIZE }).pipe(
        res
      );
    }
  } catch (error) {
    console.error('Streaming error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { streamController };
