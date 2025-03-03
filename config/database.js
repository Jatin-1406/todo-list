import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: 'localhost',
    database: 'todo_db',
    password: process.env.DB_PASSWORD,
    port: 5432,
});

export default pool;