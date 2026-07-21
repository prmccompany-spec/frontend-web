import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

export const initializePool = async () => {
  try {
    pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME || 'prmcf_db',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('✓ Database connected successfully');
    return pool;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool first.');
  }
  return pool;
};

export const query = async (sql, values) => {
  const connection = await getPool().getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
};
