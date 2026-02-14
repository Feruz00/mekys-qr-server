const { Queue, Worker } = require('bullmq');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path = require('path');
const fs = require('fs/promises');
const { Files } = require('../models');
const { getIO } = require('../socket');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const connection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

const videoQueue = new Queue('video-processing', {
  connection,
  autorun: true,
  // Suppress version warning (hack – not official)
  redisOptions: { showFriendlyErrorStack: true },
});

let totalDuration = null;

const worker = new Worker(
  'video-processing',
  async (job) => {
    const { fileId, originalPath, userId } = job.data;
    console.log(`[Worker] Starting job for file ${fileId}`);

    const file = await Files.findByPk(fileId);
    if (!file) throw new Error(`File record not found: ${fileId}`);

    const io = getIO();

    await file.update({ status: 'processing' });

    io.to(`${userId}`).emit('processing-started', { fileId });

    const isVideo = file.mimetype?.startsWith('video');
    const isAudio = file.mimetype?.startsWith('audio');

    // 🔥 If not video, don't convert
    if (!isVideo) {
      console.log(`[Worker] Skipping optimization (not video)`);

      await file.update({ status: 'ready' });

      io.to(`${userId}`).emit('processing-done', {
        fileId,
        status: 'ready',
        message: 'File ready (no optimization needed)',
      });

      return 'skipped';
    }

    const outputPath = path.join(
      path.dirname(originalPath),
      `${path.basename(originalPath, path.extname(originalPath))}-optimized.mp4`
    );

    return new Promise((resolve, reject) => {
      totalDuration = null;

      ffmpeg(originalPath)
        .on('codecData', (data) => {
          if (data.duration) {
            const [h, m, s] = data.duration.split(':').map(Number);
            totalDuration = h * 3600 + m * 60 + s;
          }
        })
        .on('progress', (progressInfo) => {
          let percent = 0;

          if (
            progressInfo.percent &&
            progressInfo.percent >= 0 &&
            progressInfo.percent <= 100
          ) {
            percent = Math.round(progressInfo.percent);
          } else if (totalDuration && progressInfo.timemark) {
            const [h, m, s] = progressInfo.timemark.split(':').map(Number);
            const current = h * 3600 + m * 60 + s;
            percent = Math.round((current / totalDuration) * 100);
          }

          percent = Math.max(0, Math.min(100, percent || 0));

          job.updateProgress(percent);

          io.to(`${userId}`).emit('progress', {
            fileId,
            percent,
            message: `Processing: ${percent}%`,
          });
        })

        // 🔥 SAFEST SETTINGS FOR iPhone + Android
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate('128k')
        .addOption('-preset', 'medium')
        .addOption('-crf', '23')
        .addOption('-pix_fmt', 'yuv420p')
        .addOption('-movflags', '+faststart')
        .outputOptions(['-profile:v main', '-level 4.0'])

        .on('end', async () => {
          try {
            // Replace original
            await fs.rename(outputPath, originalPath);

            await file.update({
              status: 'ready',
              mimetype: 'video/mp4',
            });

            io.to(`${userId}`).emit('processing-done', {
              fileId,
              status: 'ready',
              message: 'Video optimized and ready',
            });

            console.log(`[Worker] Completed file ${fileId}`);
            resolve('done');
          } catch (err) {
            reject(err);
          }
        })
        .on('error', async (err) => {
          console.error(`[Worker] FFmpeg error:`, err.message);

          await file.update({ status: 'failed' });

          io.to(`${userId}`).emit('processing-done', {
            fileId,
            status: 'failed',
            message: err.message,
          });

          reject(err);
        })
        .save(outputPath);
    });
  },
  { connection }
);

// Worker logging
worker.on('active', (job) => {
  console.log(`[Worker] Job ${job.id} started`);
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Closing worker...');
  await worker.close();
  process.exit(0);
});

module.exports = { videoQueue };
