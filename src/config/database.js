const mysql = require('mysql2/promise');
require('dotenv').config();

// Визначаємо, яку БД використовувати
const dbName = process.env.NODE_ENV === 'test'
  ? 'inventory_system_test'
  : (process.env.DB_NAME || 'inventory_system');

// Створюємо пул з'єднань
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
});

// Перевірка підключення при старті
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ Database connected successfully: ${dbName}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Ініціалізація таблиць (якщо потрібно)
async function initializeTables() {
  try {
    // Таблиця categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        idcategories INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Таблиця products
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        idproducts INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        category_id INT DEFAULT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(idcategories) ON DELETE SET NULL,
        INDEX idx_category (category_id),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Таблиця basket
    await pool.query(`
      CREATE TABLE IF NOT EXISTS basket (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(idproducts) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product (username, product_id),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Table initialization failed:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection, initializeTables };