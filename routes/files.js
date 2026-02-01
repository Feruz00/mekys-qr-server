const { deleteFile, uploadFile } = require('../controller/filesController');
const { protect, restrictTo } = require('../middleware/jwt');
const multerOptions = require('../middleware/multerOptions');

const router = require('express').Router();

router.use(protect, restrictTo('user'));

router.route('/').post(multerOptions.single('file'), uploadFile);

router.route('/:id').delete(deleteFile);

module.exports = router;
