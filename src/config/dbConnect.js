// require('dotenv').config();
const { fn, col, Sequelize } = require('sequelize');


const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
     dialect: process.env.DB_DIALECT,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Set false for self-signed certs
      },
    },
    logging: false,
});

const dbConnection = async () => {
    try {
        // await sequelize.sync({alter:true})
        await sequelize.authenticate();
        console.log('Database connected successfully');
    } catch (error) {
        console.log('Unable to connect db', error);
    }
};


module.exports = { dbConnection, sequelize};
