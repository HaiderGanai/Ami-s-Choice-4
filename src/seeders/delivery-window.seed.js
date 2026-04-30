'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('DeliverySlots', [
      // ── Same day slots (only shown if order placed before cutoffTime) ──
      {
        id: uuidv4(),
        label:       'Same Day - Morning',
        cutoffTime:  '09:00:00',   // visible only before 9am
        windowLabel: '10:00 AM – 12:00 PM',
        offsetDays:  0,
        isActive:    true,
        sortOrder:   1,
        createdAt:   new Date(),
        updatedAt:   new Date()
      },
      {
        id: uuidv4(),
        label:       'Same Day - Afternoon',
        cutoffTime:  '12:00:00',   // visible only before 12pm
        windowLabel: '1:00 PM – 3:00 PM',
        offsetDays:  0,
        isActive:    true,
        sortOrder:   2,
        createdAt:   new Date(),
        updatedAt:   new Date()
      },
      {
        id: uuidv4(),
        label:       'Same Day - Evening',
        cutoffTime:  '14:00:00',   // visible only before 2pm
        windowLabel: '4:00 PM – 7:00 PM',
        offsetDays:  0,
        isActive:    true,
        sortOrder:   3,
        createdAt:   new Date(),
        updatedAt:   new Date()
      },
      // ── Next day slots (always shown as fallback) ──
      {
        id: uuidv4(),
        label:       'Next Day - Morning',
        cutoffTime:  '23:59:59',   // always visible
        windowLabel: '9:00 AM – 11:00 AM',
        offsetDays:  1,
        isActive:    true,
        sortOrder:   4,
        createdAt:   new Date(),
        updatedAt:   new Date()
      },
      {
        id: uuidv4(),
        label:       'Next Day - Afternoon',
        cutoffTime:  '23:59:59',
        windowLabel: '12:00 PM – 3:00 PM',
        offsetDays:  1,
        isActive:    true,
        sortOrder:   5,
        createdAt:   new Date(),
        updatedAt:   new Date()
      },
      {
        id: uuidv4(),
        label:       'Next Day - Evening',
        cutoffTime:  '23:59:59',
        windowLabel: '5:00 PM – 8:00 PM',
        offsetDays:  1,
        isActive:    true,
        sortOrder:   6,
        createdAt:   new Date(),
        updatedAt:   new Date()
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('DeliverySlots', null, {});
  }
};