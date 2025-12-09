import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+05:30'
});

pool.getConnection()
    .then(conn => {
        return conn.query("SET time_zone = '+05:30'")
            .then(() => conn.release());
    })
    .catch(err => console.error("Timezone set error:", err));

export default pool;
