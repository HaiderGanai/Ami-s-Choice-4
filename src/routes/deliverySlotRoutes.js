const express = require('express');
const { getAvailableSlots } = require('../controllers/deliverySlotsController');
const deliverySlotRouter = express.Router();


deliverySlotRouter.get('/', getAvailableSlots);

module.exports = deliverySlotRouter;