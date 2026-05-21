const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/dbConnect');

const SupportForm = sequelize.define("SupportForm", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.STRING(2000),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
        defaultValue: "open",
        allowNull: false,
    },
}, {
    indexes: [
        { fields: ["userId"] },
        { fields: ["status"] },
    ],
});

module.exports = SupportForm;