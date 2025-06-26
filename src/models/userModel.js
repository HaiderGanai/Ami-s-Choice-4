const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const User = sequelize.define(
  'user',
  {
    id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Sequelize will auto-generate UUIDs
    primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profilePic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
      allowNull: false,
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    scopes: {
      withoutPassword: {
        attributes: { exclude: ['password'] },
      },
    },
  }
);

// Hook to update updatedAt manually (though Sequelize does this automatically)
User.beforeUpdate((user, options) => {
  if (user.changed('password')) {
    user.updatedAt = new Date();
  }
});

module.exports = User;
