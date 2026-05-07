const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const morgan = require('morgan');
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.query('CREATE TABLE IF NOT EXISTS basket (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), product_id INT, quantity INT)');

const swaggerDocument = {
  openapi: '3.0.0',
  info: { title: 'Inventory API', version: '1.0.0' },
  paths: {
    '/api/items': {
      get: {
        summary: 'Отримати всі товари',
        responses: { '200': { description: 'Успішно' } }
      }
    }
  }
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {return res.sendStatus(401);}

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {return res.sendStatus(403);}
    req.user = user;
    next();
  });
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories');
    res.json(rows);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { category_name } = req.body;
    if (!category_name) {return res.status(400).json({ error: 'Name required' });}
    const [result] = await pool.query('INSERT INTO categories (category_name) VALUES (?)', [category_name]);
    res.status(201).json({ id: result.insertId, category_name });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { category_name } = req.body;
    await pool.query('UPDATE categories SET category_name = ? WHERE idcategories = ?', [category_name, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE products SET category_id = NULL WHERE category_id = ?', [req.params.id]);
    await pool.query('DELETE FROM categories WHERE idcategories = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
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
    logger.error(error.message);
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

    if (rows.length === 0) {return res.status(404).json({ error: 'Item not found' });}
    res.json(rows[0]);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/items', authenticateToken, async (req, res) => {
  try {
    const { name, category, quantity, price } = req.body;
    if (!name || !category || quantity === undefined) {return res.status(400).json({ error: 'Missing fields' });}

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

    res.status(201).json({ id: result.insertId, name, category, quantity, price: price || 0 });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const { name, category, quantity, price } = req.body;
    let categoryId = null;

    if (category) {
      let [catRows] = await pool.query('SELECT idcategories FROM categories WHERE category_name = ?', [category]);
      if (catRows.length > 0) {
        categoryId = catRows[0].idcategories;
      } else {
        const [newCat] = await pool.query('INSERT INTO categories (category_name) VALUES (?)', [category]);
        categoryId = newCat.insertId;
      }
    }

    let updateQuery = 'UPDATE products SET ';
    const updateParams = [];

    if (name) { updateQuery += 'name = ?, '; updateParams.push(name); }
    if (quantity !== undefined) { updateQuery += 'quantity = ?, '; updateParams.push(quantity); }
    if (price !== undefined) { updateQuery += 'price = ?, '; updateParams.push(price); }
    if (categoryId) { updateQuery += 'category_id = ?, '; updateParams.push(categoryId); }

    updateQuery = updateQuery.slice(0, -2) + ' WHERE idproducts = ?';
    updateParams.push(req.params.id);

    await pool.query(updateQuery, updateParams);
    res.json({ success: true });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE idproducts = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/basket', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT b.id, b.product_id, b.quantity, p.name, p.price FROM basket b JOIN products p ON b.product_id = p.idproducts WHERE b.username = ?', [req.user.username]);
    res.json(rows);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/basket', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const requestedQty = parseInt(quantity);

    if (isNaN(requestedQty) || requestedQty <= 0) {
      return res.status(400).json({ error: 'Невірна кількість' });
    }

    const [products] = await pool.query('SELECT quantity FROM products WHERE idproducts = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Товар не знайдено' });
    }

    const stock = products[0].quantity;
    const [existing] = await pool.query('SELECT id, quantity FROM basket WHERE username = ? AND product_id = ?', [req.user.username, product_id]);

    const currentBasketQty = existing.length > 0 ? existing[0].quantity : 0;
    const newTotalQty = currentBasketQty + requestedQty;

    if (newTotalQty > stock) {
      return res.status(400).json({ error: `Доступно лише ${stock} шт.` });
    }

    if (existing.length > 0) {
      await pool.query('UPDATE basket SET quantity = ? WHERE id = ?', [newTotalQty, existing[0].id]);
    } else {
      await pool.query('INSERT INTO basket (username, product_id, quantity) VALUES (?, ?, ?)', [req.user.username, product_id, requestedQty]);
    }
    res.status(201).json({ success: true });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/basket/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM basket WHERE id = ? AND username = ?', [req.params.id, req.user.username]);
    res.status(204).send();
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running at: http://localhost:${PORT}`);
  });
}

module.exports = { app, pool };