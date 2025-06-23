const express = require('express');
const { getProfile, updateProfile, deleteProfile, changeUserPassword } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/jwtMiddleware');
const upload = require('../middlewares/upload');
const userRouter = express.Router();

userRouter.get('/me',verifyToken, getProfile);
userRouter.patch('/me',verifyToken,upload.single('profilePic'), updateProfile);
userRouter.delete('/me',verifyToken, deleteProfile);
userRouter.patch('/me/password',verifyToken, changeUserPassword);

module.exports = { userRouter };