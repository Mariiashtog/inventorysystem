const { pool } = require('../config/database');

class CategoryModel {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY category_name');
    return rows;
  }

  static async findByName(name) {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE category_name = ?',
      [name]
    );
    return rows[0] || null;
  }

  static async create(category_name) {
    const [result] = await pool.query(
      'INSERT INTO categories (category_name) VALUES (?)',
      [category_name]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE idcategories = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async update(id, category_name) {
    await pool.query(
      'UPDATE categories SET category_name = ? WHERE idcategories = ?',
      [category_name, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    // Спочатку відв'язуємо продукти
    await pool.query(
      'UPDATE products SET category_id = NULL WHERE category_id = ?',
      [id]
    );
    const [result] = await pool.query(
      'DELETE FROM categories WHERE idcategories = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = CategoryModel;