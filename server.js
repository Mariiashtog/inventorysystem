const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

let inventory = [];
let currentId = 1;

app.get('/api/items', (req, res) => {
    const { name, category } = req.query;
    let results = inventory;

    if (name) {
        results = results.filter(item => item.name.toLowerCase().includes(name.toLowerCase()));
    }
    if (category) {
        results = results.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }

    res.json(results);
});

app.get('/api/items/:id', (req, res) => {
    const item = inventory.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
});

app.post('/api/items', (req, res) => {
    const { name, category, quantity, price } = req.body;

    if (!name || !category || quantity === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newItem = {
        id: currentId++,
        name,
        category,
        quantity,
        price: price || 0
    };

    inventory.push(newItem);
    res.status(201).json(newItem);
});

app.put('/api/items/:id', (req, res) => {
    const item = inventory.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const { name, category, quantity, price } = req.body;

    if (name) item.name = name;
    if (category) item.category = category;
    if (quantity !== undefined) item.quantity = quantity;
    if (price !== undefined) item.price = price;

    res.json(item);
});

app.delete('/api/items/:id', (req, res) => {
    const index = inventory.findIndex(i => i.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Item not found' });

    inventory.splice(index, 1);
    res.status(204).send();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server running at: http://localhost:${PORT}`);
    });
}

module.exports = { app, inventory };