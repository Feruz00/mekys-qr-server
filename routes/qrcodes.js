const {
  uploadFile,
  updateFile,
  deleteFiles,
  getFiles,
  getFile,
  deleteFile,
} = require('../controller/qrcodes');
const { protect, restrictTo } = require('../middleware/jwt');

const router = require('express').Router();

router.use(protect, restrictTo('user'));

router.route('/').post(uploadFile).delete(deleteFiles).get(getFiles);

router.route('/:id').get(getFile).patch(updateFile).delete(deleteFile);

module.exports = router;
