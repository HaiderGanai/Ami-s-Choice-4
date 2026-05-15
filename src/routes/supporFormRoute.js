const express = require('express');
const { verifyToken } = require('../middlewares/jwtMiddleware');
const { contactSupport } = require('../controllers/supportFormController');
const supportFormRouter = express.Router();

supportFormRouter.post('/support', verifyToken, contactSupport);

module.exports = { supportFormRouter };