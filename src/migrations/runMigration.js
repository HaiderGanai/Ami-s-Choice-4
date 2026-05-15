// migrations/runMigration.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../config/dbConnect');

const migrate = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN isEmailVerified BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('✅ Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();