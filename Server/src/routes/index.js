const express = require('express');
const { getApiStatus, getEventStats } = require('../controllers/indexController');
const { login } = require('../controllers/authController');

const router = express.Router();

router.get('/', getApiStatus);
router.get('/events/stats', getEventStats);
router.post('/login', login);

module.exports = router;
