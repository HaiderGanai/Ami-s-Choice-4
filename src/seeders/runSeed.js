// seeders/runSeed.js
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { DeliverySlot } = require('../models');  // adjust path if needed

const seed = async () => {
  try {
    await DeliverySlot.bulkCreate([
      {
        id:          uuidv4(),
        label:       'Same Day - Morning',
        cutoffTime:  '09:00:00',
        windowLabel: '10:00 AM – 12:00 PM',
        offsetDays:  0,
        isActive:    true,
        sortOrder:   1,
      },
      {
        id:          uuidv4(),
        label:       'Same Day - Afternoon',
        cutoffTime:  '12:00:00',
        windowLabel: '1:00 PM – 3:00 PM',
        offsetDays:  0,
        isActive:    true,
        sortOrder:   2,
      },
      {
        id:          uuidv4(),
        label:       'Same Day - Evening',
        cutoffTime:  '14:00:00',
        windowLabel: '4:00 PM – 7:00 PM',
        offsetDays:  0,
        isActive:    true,
        sortOrder:   3,
      },
      {
        id:          uuidv4(),
        label:       'Next Day - Morning',
        cutoffTime:  '23:59:59',
        windowLabel: '9:00 AM – 11:00 AM',
        offsetDays:  1,
        isActive:    true,
        sortOrder:   4,
      },
      {
        id:          uuidv4(),
        label:       'Next Day - Afternoon',
        cutoffTime:  '23:59:59',
        windowLabel: '12:00 PM – 3:00 PM',
        offsetDays:  1,
        isActive:    true,
        sortOrder:   5,
      },
      {
        id:          uuidv4(),
        label:       'Next Day - Evening',
        cutoffTime:  '23:59:59',
        windowLabel: '5:00 PM – 8:00 PM',
        offsetDays:  1,
        isActive:    true,
        sortOrder:   6,
      },
    ]);

    console.log('✅ Delivery slots seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();