const express = require('express');
const adminRouter = express.Router();

const { login } = require('../controllers/adminController');

adminRouter.post('/login', login);

module.exports = { adminRouter };