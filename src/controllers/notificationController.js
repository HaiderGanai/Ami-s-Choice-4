const { Notification } = require('../models');
const { Op } = require('sequelize');

// GET /notifications — paginated list of all notifications for the logged-in user
const listNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Notifications fetched successfully!',
      data: notifications,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('listNotifications Error:', error);
    return res.status(500).json({ status: 'fail', message: 'Internal Server Error!' });
  }
};

// GET /notifications/:id — fetch a single notification and mark it as read
const readNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) {
      return res.status(404).json({ status: 'fail', message: 'Notification not found!' });
    }

    if (!notification.isRead) {
      await notification.update({ isRead: true });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Notification fetched successfully!',
      data: notification,
    });
  } catch (error) {
    console.error('readNotification Error:', error);
    return res.status(500).json({ status: 'fail', message: 'Internal Server Error!' });
  }
};

// PATCH /notifications/read-all — mark every unread notification as read
const readAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    return res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read!',
    });
  } catch (error) {
    console.error('readAllNotifications Error:', error);
    return res.status(500).json({ status: 'fail', message: 'Internal Server Error!' });
  }
};

// GET /notifications/unread-count — count of unread notifications
const unreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.count({ where: { userId, isRead: false } });

    return res.status(200).json({
      status: 'success',
      message: 'Unread notification count fetched successfully!',
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error('unreadCount Error:', error);
    return res.status(500).json({ status: 'fail', message: 'Internal Server Error!' });
  }
};

module.exports = { listNotifications, readNotification, readAllNotifications, unreadCount };
