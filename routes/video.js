const express = require('express');
const router = express.Router();
const { openVideoByQr } = require('../controller/videoController');

router.get('/video/:id', openVideoByQr);

module.exports = router;
