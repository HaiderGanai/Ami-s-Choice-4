const express = require('express');
const {
  listNotifications,
  readNotification,
  readAllNotifications,
  unreadCount,
} = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/jwtMiddleware');

const notificationRouter = express.Router();

notificationRouter.get('/notifications', verifyToken, listNotifications);
notificationRouter.get('/notifications/unread-count', verifyToken, unreadCount);
notificationRouter.get('/notifications/:id', verifyToken, readNotification);
notificationRouter.patch('/notifications/read-all', verifyToken, readAllNotifications);

module.exports = { notificationRouter };
