const { pool } = require('../config/database');

class ProductModel {
  static async findAll({ name, category, page, limit } = {}) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT p.idproducts as id, p.name, p.quantity, p.price, p.image_url,
             c.category_name as category, p.created_at, p.updated_at
      FROM products p
             LEFT JOIN categories c ON p.category_id = c.idcategories
      WHERE 1=1
    `;
    const params = [];

    if (name && name.trim()) {
      query += ' AND p.name LIKE ?';
      params.push(`%${name.trim()}%`);
    }
    if (category && category.trim()) {
      query += ' AND c.category_name = ?';
      params.push(category.trim());
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [rows] = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
             LEFT JOIN categories c ON p.category_id = c.idcategories
      WHERE 1=1
    `;
    const countParams = [];

    if (name && name.trim()) {
      countQuery += ' AND p.name LIKE ?';
      countParams.push(`%${name.trim()}%`);
    }
    if (category && category.trim()) {
      countQuery += ' AND c.category_name = ?';
      countParams.push(category.trim());
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    return {
      data: rows,
      pagination: {
        total: parseInt(total),
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  static async findById(id) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) return null;

    const [rows] = await pool.query(`
      SELECT p.idproducts as id, p.name, p.quantity, p.price, p.image_url,
             c.category_name as category, p.created_at, p.updated_at
      FROM products p
             LEFT JOIN categories c ON p.category_id = c.idcategories
      WHERE p.idproducts = ?
    `, [numericId]);

    return rows[0] || null;
  }

  static async create({ name, quantity, price, category, image_url }) {
    if (!name || typeof quantity !== 'number' || !category) {
      throw new Error('Missing required fields');
    }

    const [catRows] = await pool.query(
      'SELECT idcategories FROM categories WHERE category_name = ?',
      [category]
    );

    let categoryId;
    if (catRows.length > 0) {
      categoryId = catRows[0].idcategories;
    } else {
      const [newCat] = await pool.query(
        'INSERT INTO categories (category_name) VALUES (?)',
        [category]
      );
      categoryId = newCat.insertId;
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, quantity, price, category_id, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, quantity, price || 0, categoryId, image_url || null]
    );

    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) return null;

    const allowedFields = ['name', 'quantity', 'price', 'category', 'image_url'];
    const updateFields = [];
    const params = [];

    if (data.category) {
      const [catRows] = await pool.query(
        'SELECT idcategories FROM categories WHERE category_name = ?',
        [data.category]
      );

      let categoryId;
      if (catRows.length > 0) {
        categoryId = catRows[0].idcategories;
      } else {
        const [newCat] = await pool.query(
          'INSERT INTO categories (category_name) VALUES (?)',
          [data.category]
        );
        categoryId = newCat.insertId;
      }
      updateFields.push('category_id = ?');
      params.push(categoryId);
    }

    for (const key of allowedFields) {
      if (key === 'category') continue;
      if (data[key] !== undefined && data[key] !== null) {
        updateFields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (updateFields.length === 0) {
      return this.findById(numericId);
    }

    params.push(numericId);
    await pool.query(
      `UPDATE products SET ${updateFields.join(', ')} WHERE idproducts = ?`,
      params
    );

    return this.findById(numericId);
  }

  static async delete(id) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) return false;

    const [result] = await pool.query(
      'DELETE FROM products WHERE idproducts = ?',
      [numericId]
    );
    return result.affectedRows > 0;
  }

  static async checkStock(productId, quantity) {
    const numericId = parseInt(productId);
    const numericQty = parseInt(quantity);

    if (isNaN(numericId) || isNaN(numericQty)) return false;

    const [rows] = await pool.query(
      'SELECT quantity FROM products WHERE idproducts = ?',
      [numericId]
    );

    if (rows.length === 0) return false;
    return rows[0].quantity >= numericQty;
  }
}

module.exports = ProductModel;