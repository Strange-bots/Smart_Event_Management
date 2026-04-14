const express = require('express');
const { getApiStatus } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');

const router = express.Router();

router.get('/', getApiStatus);
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;
