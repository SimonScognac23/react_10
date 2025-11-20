const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
console.log(process.env) // visualizza tutte le variabili di ambiente per il debug

// crea una connessione al database
const pool = mysql.createPool({
    host: process.env.DB_HOST, // Indirizzo del server del database
    user: process.env.DB_USER,
    port: process.env.DB_PORT, // Porta del server del database
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,  
});
module.exports = pool.promise(); // esporta la connessione come una promessa