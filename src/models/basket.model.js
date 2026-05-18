const { pool } = require('../config/database');

class BasketModel {
  static async findByUser(username) {
    const [rows] = await pool.query(`
      SELECT b.id, b.product_id, b.quantity, p.name, p.price, p.quantity as stock
      FROM basket b
      JOIN products p ON b.product_id = p.idproducts
      WHERE b.username = ?
    `, [username]);
    return rows;
  }

  static async addOrUpdate(username, product_id, quantity) {
    // Перевіряємо, чи вже є в кошику
    const [existing] = await pool.query(
      'SELECT id, quantity FROM basket WHERE username = ? AND product_id = ?',
      [username, product_id]
    );

    if (existing.length > 0) {
      // Оновлюємо кількість
      const newQty = existing[0].quantity + quantity;
      await pool.query(
        'UPDATE basket SET quantity = ? WHERE id = ?',
        [newQty, existing[0].id]
      );
      return { id: existing[0].id, quantity: newQty };
    } else {
      // Додаємо новий запис
      const [result] = await pool.query(
        'INSERT INTO basket (username, product_id, quantity) VALUES (?, ?, ?)',
        [username, product_id, quantity]
      );
      return { id: result.insertId, quantity };
    }
  }

  static async remove(username, basketId) {
    const [result] = await pool.query(
      'DELETE FROM basket WHERE id = ? AND username = ?',
      [basketId, username]
    );
    return result.affectedRows > 0;
  }

  static async clearUserBasket(username) {
    await pool.query('DELETE FROM basket WHERE username = ?', [username]);
  }
}

module.exports = BasketModel;