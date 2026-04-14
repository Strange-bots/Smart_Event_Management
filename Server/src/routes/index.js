const express = require('express');
const { getApiStatus } = require('../controllers/indexController');
const { login } = require('../controllers/authController');

const router = express.Router();

router.get('/', getApiStatus);
router.post('/login', login);

module.exports = router;
