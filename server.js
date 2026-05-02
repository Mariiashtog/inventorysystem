const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(__dirname));

let inventory = [
    {
        id: 1,
        name: "Арт-постер «Місячна ніч»",
        category: "Мистецтво",
        quantity: 10,
        price: 490,
        description: "Друк на якісному папері, розмір 50x70 см."
    },
    {
        id: 2,
        name: "Керамічна чашка",
        category: "Посуд",
        quantity: 5,
        price: 850,
        description: "Унікальна глазур, об'єм 350 мл."
    },
    {
        id: 3,
        name: "Мінімалістичний годинник",
        category: "Декор",
        quantity: 3,
        price: 1240,
        description: "Тихий механізм, дерев'яний корпус."
    }
];
let currentId = 4;

// Отримати всі товари
app.get('/api/items', (req, res) => {
    const { name, category } = req.query;
    let results = inventory;

    if (name) {
        results = results.filter(item => item.name.toLowerCase().includes(name.toLowerCase()));
    }
    if (category) {
        results = results.filter(item => item.category === category);
    }

    res.json(results);
});

// Отримати один товар
app.get('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const item = inventory.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Товар не знайдено' });
    res.json(item);
});

// Додати товар
app.post('/api/items', (req, res) => {
    const { name, category, quantity, price, description } = req.body;

    if (!name || !category) {
        return res.status(400).json({ error: "Назва та категорія обов'язкові" });
    }

    const newItem = {
        id: currentId++,
        name: name,
        category: category,
        quantity: quantity || 1,
        price: price || 0,
        description: description || ''
    };

    inventory.push(newItem);
    console.log('Додано товар:', newItem);
    res.status(201).json(newItem);
});

// Оновити товар
app.put('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const item = inventory.find(i => i.id === id);
    if (!item) return res.status(404).json({ error: 'Товар не знайдено' });

    const { name, category, quantity, price, description } = req.body;

    if (name) item.name = name;
    if (category) item.category = category;
    if (quantity !== undefined) item.quantity = quantity;
    if (price !== undefined) item.price = price;
    if (description !== undefined) item.description = description;

    console.log('Оновлено товар:', item);
    res.json(item);
});

// Видалити товар
app.delete('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = inventory.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: 'Товар не знайдено' });

    inventory.splice(index, 1);
    console.log('Видалено товар з ID:', id);
    res.status(204).send();
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Сервер запущено на http://localhost:${PORT}`);
    console.log(`📦 API доступний за адресою: http://localhost:${PORT}/api/items`);
});