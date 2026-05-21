
const express = require('express');
const { dbConnection, sequelize } = require('./config/dbConnect');
const { loadRoutes } = require('./routes');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());
// console.log('hello from the app.js')
require('./associations');
app.use('/uploads', express.static('uploads'));

sequelize.sync({ alter: true });

loadRoutes(app);

module.exports = app;
