const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const Categories = sequelize.define('categorie',{
    name: {
        type: DataTypes.STRING,
        allowNull:false
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Categories;