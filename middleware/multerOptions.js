const multer = require('multer');
const fs = require('fs');
const path = require('path');

const fileCreate = (url) => {
  if (!fs.existsSync(url)) {
    fs.mkdirSync(url);
  }
};

const folderToCreate = (i) => {
  let uploadDirectory = './uploads';
  const year = new Date().getFullYear(),
    month = new Date().getMonth(),
    day = new Date().getDate();
  fileCreate(`${uploadDirectory}`);
  fileCreate(`${uploadDirectory}/${i}`);
  fileCreate(`${uploadDirectory}/${i}/${year}`);
  fileCreate(`${uploadDirectory}/${i}/${year}/${month}`);
  fileCreate(`${uploadDirectory}/${i}/${year}/${month}/${day}`);
  return `${uploadDirectory}/${i}/${year}/${month}/${day}`;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let url;

    if (file.mimetype.startsWith('video/')) {
      url = folderToCreate('video');
    } else if (file.mimetype.startsWith('audio/')) {
      url = folderToCreate('audio');
    } else {
      return cb(new Error('Invalid file type. Only videos are allowed.'));
    }

    cb(null, url);
  },
  filename: function (req, file, cb) {
    const encodedFilename = Buffer.from(file.originalname, 'latin1')
      .toString('utf8')
      .split(' ')
      .join('_');
    cb(null, Date.now() + '-' + encodedFilename);
  },
});

// **File Filter Function**
const fileFilter = (req, file, cb) => {
  if (!req.user) {
    return cb(new Error('Unauthorized. No user information found.'));
  }
  const allowedTypes = ['video/', 'audio/'];
  const mime = file.mimetype;

  console.log(file);

  // const allowedExtensions = [
  //   // videos
  //   '.mp4',
  //   '.webm',
  //   '.avi',
  //   '.mkv',
  //   // audio
  //   '.mp3',
  //   '.wav',
  // ];
  const ext = path.extname(file.originalname).toLowerCase();

  const mimeOk =
    allowedTypes.some(
      (type) => mime.startsWith(type) || allowedTypes.includes(mime)
    ) || false;
  // const extOk = allowedExtensions.includes(ext);

  if (mimeOk) {
    cb(null, true);
  } else {
    cb(new Error(`❌ Invalid file: ${file.originalname}\n`));
  }
};

const multerOptions = multer({
  storage: storage,
  fileFilter: fileFilter,
  // limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

module.exports = multerOptions;
