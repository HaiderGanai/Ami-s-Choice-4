// migrations/runMigration.js
require('dotenv').config();
const { sequelize } = require('../config/dbConnect');  // adjust path

const migrate = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE orders
      ADD COLUMN deliverySlotId CHAR(36) NULL,
      ADD COLUMN estimatedDelivery VARCHAR(255) NULL;
    `);
    console.log('✅ Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();