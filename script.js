// API URL
const API_URL = 'http://localhost:3000/api/items';

// Змінні
let currentEditId = null;
let allProducts = [];

// Чекаємо завантаження сторінки
document.addEventListener('DOMContentLoaded', () => {
    console.log('Сторінка завантажена, шукаємо елементи...');

    // Отримуємо елементи
    const modal = document.getElementById('productModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const saveBtn = document.getElementById('saveProductBtn');
    const container = document.getElementById('productsContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    // Перевіряємо, чи знайшли всі кнопки
    console.log('Кнопка "Додати товар":', openBtn);
    console.log('Кнопка "Скасувати":', closeBtn);
    console.log('Кнопка "Зберегти":', saveBtn);

    // Функція завантаження товарів
    async function loadProducts() {
        try {
            console.log('Завантаження товарів...');
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Помилка завантаження');
            allProducts = await response.json();
            console.log('Отримано товарів:', allProducts.length);
            applyFilters();
        } catch (error) {
            console.error('Помилка завантаження:', error);
            if (container) {
                container.innerHTML = '<div class="empty-state">❌ Сервер не запущено! Виконайте node server.js</div>';
            }
        }
    }

    // Функція фільтрації
    function applyFilters() {
        if (!searchInput || !categoryFilter) return;

        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        let filtered = [...allProducts];

        if (searchTerm) {
            filtered = filtered.filter(p => p.name && p.name.toLowerCase().includes(searchTerm));
            console.log('Пошук:', searchTerm, 'Знайдено:', filtered.length);
        }

        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }

        renderProducts(filtered);
    }

    // Функція відображення
    function renderProducts(products) {
        if (!container) return;

        if (!products || products.length === 0) {
            container.innerHTML = '<div class="empty-state">✨ Товарів поки немає. Натисніть «Додати товар»</div>';
            return;
        }

        container.innerHTML = '';

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-img">${getEmoji(product.category)}</div>
                <div class="product-title">${escapeHtml(product.name)}</div>
                <div class="product-price">${product.price} ₴</div>
                <div class="product-desc">${escapeHtml(product.description || 'Без опису')}</div>
                <div style="margin: 10px 0">
                    <span class="badge">📁 ${escapeHtml(product.category)}</span>
                    <span class="badge">📦 ${product.quantity || 1} шт.</span>
                </div>
                <div class="product-actions">
                    <button class="edit-btn" onclick="editProduct(${product.id})">✏️ Редагувати</button>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">🗑️ Видалити</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Допоміжні функції
    function getEmoji(category) {
        const emojis = {
            'Мистецтво': '🎨',
            'Посуд': '🍽️',
            'Декор': '🪴',
            'Електроніка': '📱',
            'Одяг': '👕'
        };
        return emojis[category] || '📦';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Функції для кнопок (глобальні)
    window.editProduct = async function(id) {
        console.log('Редагування товару ID:', id);
        try {
            const response = await fetch(`${API_URL}/${id}`);
            const product = await response.json();

            currentEditId = id;
            document.getElementById('modalTitle').textContent = '✏️ Редагувати товар';
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productQuantity').value = product.quantity || 1;
            document.getElementById('productDesc').value = product.description || '';
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Помилка:', error);
            alert('Не вдалося завантажити товар');
        }
    };

    window.deleteProduct = async function(id) {
        if (confirm('Видалити товар?')) {
            console.log('Видалення товару ID:', id);
            try {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                await loadProducts();
            } catch (error) {
                console.error('Помилка видалення:', error);
                alert('Не вдалося видалити');
            }
        }
    };

    // Відкриття модалки
    function openModal() {
        console.log('Відкриття модалки');
        currentEditId = null;
        document.getElementById('modalTitle').textContent = '➕ Новий товар';
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productCategory').value = 'Мистецтво';
        document.getElementById('productQuantity').value = '1';
        document.getElementById('productDesc').value = '';
        modal.style.display = 'flex';
    }

    // Закриття модалки
    function closeModal() {
        modal.style.display = 'none';
    }

    // Збереження товару
    async function saveProduct() {
        console.log('Збереження товару...');

        const name = document.getElementById('productName').value.trim();
        const price = document.getElementById('productPrice').value;
        const category = document.getElementById('productCategory').value;
        const quantity = document.getElementById('productQuantity').value;
        const description = document.getElementById('productDesc').value.trim();

        if (!name) {
            alert('Введіть назву товару');
            return;
        }

        if (!price || price <= 0) {
            alert('Введіть ціну');
            return;
        }

        const productData = {
            name: name,
            price: Number(price),
            category: category,
            quantity: Number(quantity) || 1,
            description: description
        };

        try {
            let response;
            if (currentEditId) {
                response = await fetch(`${API_URL}/${currentEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            } else {
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            }

            if (response.ok) {
                closeModal();
                await loadProducts();
                console.log('Товар збережено!');
            } else {
                alert('Помилка збереження');
            }
        } catch (error) {
            console.error('Помилка:', error);
            alert('Помилка збереження. Переконайтесь, що сервер запущено');
        }
    }

    // Скидання фільтрів
    function resetFilters() {
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        applyFilters();
    }

    // Додаємо обробники подій
    if (openBtn) openBtn.onclick = openModal;
    if (closeBtn) closeBtn.onclick = closeModal;
    if (saveBtn) saveBtn.onclick = saveProduct;
    if (resetFiltersBtn) resetFiltersBtn.onclick = resetFilters;
    if (searchInput) searchInput.oninput = applyFilters;
    if (categoryFilter) categoryFilter.onchange = applyFilters;

    // Закриття по кліку на фон
    window.onclick = function(e) {
        if (e.target === modal) closeModal();
    };

    // Завантажуємо товари
    loadProducts();
});