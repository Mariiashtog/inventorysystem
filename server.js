const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/api/items', async (req, res) => {
    try {
        const { name, category } = req.query;
        let query = `
            SELECT p.idproducts as id, p.name, p.quantity, p.price, c.category_name as category 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.idcategories 
            WHERE 1=1
        `;
        const params = [];

        if (name) {
            query += ' AND p.name LIKE ?';
            params.push(`%${name}%`);
        }
        if (category) {
            query += ' AND c.category_name = ?';
            params.push(category);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/items/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.idproducts as id, p.name, p.quantity, p.price, c.category_name as category 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.idcategories 
            WHERE p.idproducts = ?
        `, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/items', async (req, res) => {
    try {
        const { name, category, quantity, price } = req.body;
        if (!name || !category || quantity === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let [catRows] = await pool.query('SELECT idcategories FROM categories WHERE category_name = ?', [category]);
        let categoryId;

        if (catRows.length > 0) {
            categoryId = catRows[0].idcategories;
        } else {
            const [newCat] = await pool.query('INSERT INTO categories (category_name) VALUES (?)', [category]);
            categoryId = newCat.insertId;
        }

        const [result] = await pool.query(
            'INSERT INTO products (name, quantity, price, category_id) VALUES (?, ?, ?, ?)',
            [name, quantity, price || 0, categoryId]
        );

        res.status(201).json({
            id: result.insertId,
            name,
            category,
            quantity,
            price: price || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/items/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM products WHERE idproducts = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running at: http://localhost:${PORT}`);
    });
}

module.exports = { app };