const express = require('express');
const { register, login, forgotPassword, resetPassword, verifyOtp, logout } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/jwtMiddleware');
const { sendEmailController } = require('../controllers/emailController');
const upload = require('../middlewares/upload');
const authRouter = express.Router();


authRouter.post('/register',upload.single('profilePic'), register);
authRouter.post('/login', login);
authRouter.post('/auth/forgotPassword', forgotPassword);
authRouter.post('/auth/sendemail', sendEmailController);
authRouter.post('/auth/verifyOtp', verifyOtp);
authRouter.patch('/auth/resetPassword', verifyToken, resetPassword);
authRouter.post('/auth/logout', verifyToken, logout);

module.exports = { authRouter };