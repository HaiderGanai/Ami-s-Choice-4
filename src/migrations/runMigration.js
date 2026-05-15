// migrations/runMigration.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../config/dbConnect');

const migrate = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS isEmailVerified BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('✅ Migration successful: users.isEmailVerified added');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();