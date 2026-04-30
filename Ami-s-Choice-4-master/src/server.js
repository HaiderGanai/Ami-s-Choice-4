require('dotenv').config();

const app = require("./app");
const { dbConnection } = require('./config/dbConnect');

const port = 3000;
const server = app.listen(port, () =>{
    console.log(`App running on port: ${port}...`);
    dbConnection();
});

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION!!! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1); //optional
    });
});


process.on('uncaughtException', err =>{
    console.log('UNCAUGHT EXCEPTION!!! Shutting down...');
    console.log(err.name, err.message);
    server.close(() =>{
        process.exit(1) //necessary
    })
})

