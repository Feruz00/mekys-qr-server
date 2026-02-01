const { streamController } = require('../controller/streamController');

const router = require('express').Router();

router.route('/:id').get(streamController);

module.exports = router;
