const API_URL = '/api/items';

let currentEditId = null; // Для відстеження, чи редагуємо ми товар

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const saveBtn = document.getElementById('saveProductBtn');
    const container = document.getElementById('productsContainer');

    // Фільтри
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    let allProducts = []; // Зберігаємо всі товари для фільтрації

    // Завантаження товарів з сервера
    const loadProducts = async () => {
        try {
            const res = await fetch(API_URL);
            allProducts = await res.json();
            applyFilters();
        } catch (error) {
            console.error('Помилка завантаження:', error);
            container.innerHTML = '<div class="empty-state">❌ Помилка завантаження товарів. Переконайтесь, що сервер запущено</div>';
        }
    };

    // Фільтрація товарів
    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        let filtered = allProducts;

        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
        }

        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }

        render(filtered);
    };

    // Відображення товарів
    const render = (products) => {
        container.innerHTML = '';
        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state">✨ Товарів поки немає. Натисніть «Додати товар»</div>';
            return;
        }

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-img">${getEmojiForCategory(p.category)}</div>
                <div class="product-title">${escapeHtml(p.name)}</div>
                <div class="product-price">${p.price} ₴</div>
                <div class="product-desc">${escapeHtml(p.description || 'Без опису')}</div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                    <span class="badge category-badge">📁 ${escapeHtml(p.category)}</span>
                    <span class="badge quantity-badge">📦 В наявності: ${p.quantity || 1} шт.</span>
                </div>
                <div class="product-actions">
                    <button class="edit-btn" data-id="${p.id}">✏️ Редагувати</button>
                    <button class="delete-btn" data-id="${p.id}">🗑️ Видалити</button>
                </div>
            `;
            container.appendChild(card);
        });

        // Додаємо обробники для кнопок редагування та видалення
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editProduct(parseInt(btn.dataset.id)));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(parseInt(btn.dataset.id)));
        });
    };

    // Емодзі для категорій
    const getEmojiForCategory = (category) => {
        const emojis = {
            'Мистецтво': '🎨',
            'Посуд': '🍽️',
            'Декор': '🪴',
            'Електроніка': '📱',
            'Одяг': '👕'
        };
        return emojis[category] || '📦';
    };

    // Функція для захисту від XSS
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Відкриття модалки для додавання
    const openAddModal = () => {
        currentEditId = null;
        modalTitle.textContent = '➕ Новий товар';
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productCategory').value = 'Мистецтво';
        document.getElementById('productQuantity').value = '1';
        document.getElementById('productDesc').value = '';
        modal.style.display = 'flex';
    };

    // Відкриття модалки для редагування
    const editProduct = async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            const product = await res.json();

            currentEditId = id;
            modalTitle.textContent = '✏️ Редагувати товар';
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productQuantity').value = product.quantity || 1;
            document.getElementById('productDesc').value = product.description || '';
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Помилка завантаження товару:', error);
            alert('Не вдалося завантажити дані товару');
        }
    };

    // Видалення товару
    const deleteProduct = async (id) => {
        if (confirm('Ви впевнені, що хочете видалити цей товар?')) {
            try {
                const res = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    await loadProducts();
                } else {
                    alert('Помилка при видаленні товару');
                }
            } catch (error) {
                console.error('Помилка:', error);
                alert('Не вдалося видалити товар');
            }
        }
    };

    // Закриття модалки (кнопка "Скасувати")
    const closeModal = () => {
        modal.style.display = 'none';
        currentEditId = null;
    };

    // Збереження товару (додавання або оновлення)
    const saveProduct = async () => {
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
            alert('Введіть коректну ціну');
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
                // Оновлення існуючого товару
                response = await fetch(`${API_URL}/${currentEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            } else {
                // Додавання нового товару
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            }

            if (response.ok) {
                closeModal();
                await loadProducts();
            } else {
                alert('Помилка при збереженні товару');
            }
        } catch (error) {
            console.error('Помилка:', error);
            alert('Не вдалося зберегти товар');
        }
    };

    // Скидання фільтрів
    const resetFilters = () => {
        searchInput.value = '';
        categoryFilter.value = '';
        applyFilters();
    };

    // ========== ПОДІЇ ==========
    openBtn.addEventListener('click', openAddModal);
    closeBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveProduct);
    resetFiltersBtn.addEventListener('click', resetFilters);
    searchInput.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);

    // Закриття модалки при кліку поза нею
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Завантажуємо товари при старті
    loadProducts();
});