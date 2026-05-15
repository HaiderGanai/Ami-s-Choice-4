require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../config/dbConnect');

const addColumnIfNotExists = async (table, column, definition) => {
  const dbName = sequelize.config.database;
  const [rows] = await sequelize.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}';
  `);
  if (rows.length === 0) {
    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
    console.log(`✅ Migration: ${table}.${column}`);
  } else {
    console.log(`✅ Migration: ${table}.${column} (already exists, skipped)`);
  }
};

const migrate = async () => {
  try {
    await addColumnIfNotExists('users', 'isEmailVerified', 'BOOLEAN NOT NULL DEFAULT false');
    await addColumnIfNotExists('products', 'isBlocked', 'BOOLEAN NOT NULL DEFAULT false');
    await addColumnIfNotExists('categories', 'isBlocked', 'BOOLEAN NOT NULL DEFAULT false');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
