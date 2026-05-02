const productsContainer = document.getElementById('productsContainer');
const productModal = document.getElementById('productModal');
const categoryModal = document.getElementById('categoryModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const openCatModalBtn = document.getElementById('openCatModalBtn');
const closeCatModalBtn = document.getElementById('closeCatModalBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const categoryFilter = document.getElementById('categoryFilter');
const productCategory = document.getElementById('productCategory');
const editCategorySelect = document.getElementById('editCategorySelect');

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();

        categoryFilter.innerHTML = '<option value="">Всі категорії</option>';
        productCategory.innerHTML = '';
        editCategorySelect.innerHTML = '<option value="">Оберіть категорію...</option>';

        categories.forEach(cat => {
            categoryFilter.innerHTML += `<option value="${cat.category_name}">${cat.category_name}</option>`;
            productCategory.innerHTML += `<option value="${cat.category_name}">${cat.category_name}</option>`;
            editCategorySelect.innerHTML += `<option value="${cat.idcategories}">${cat.category_name}</option>`;
        });
    } catch (error) {
        console.error(error);
    }
}

async function loadProducts(search = '', category = '') {
    try {
        let url = '/api/items?';
        if (search) url += `name=${encodeURIComponent(search)}&`;
        if (category) url += `category=${encodeURIComponent(category)}`;

        const response = await fetch(url);
        const data = await response.json();

        productsContainer.innerHTML = '';

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const catName = item.category ? item.category : 'Без категорії';

            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>Категорія: ${catName}</p>
                <p>Кількість: ${item.quantity} шт.</p>
                <div class="price" style="margin-bottom: 15px;"><strong>${item.price} ₴</strong></div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editProduct(${item.id})" style="padding: 6px 12px; cursor: pointer; border: 1px solid #ddd; border-radius: 4px; background: white;">✏️ Змінити</button>
                    <button onclick="deleteProduct(${item.id})" style="padding: 6px 12px; cursor: pointer; border: 1px solid #ff4d4f; border-radius: 4px; background: white; color: #ff4d4f;">🗑️ Видалити</button>
                </div>
            `;
            productsContainer.appendChild(card);
        });
    } catch (error) {
        console.error(error);
    }
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    loadProducts(e.target.value, categoryFilter.value);
});

categoryFilter.addEventListener('change', (e) => {
    loadProducts(document.getElementById('searchInput').value, e.target.value);
});

document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    categoryFilter.value = '';
    loadProducts();
});

openModalBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = '➕ Новий товар';
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productQuantity').value = '1';
    productModal.style.display = 'block';
});

closeModalBtn.addEventListener('click', () => productModal.style.display = 'none');
openCatModalBtn.addEventListener('click', () => categoryModal.style.display = 'block');
closeCatModalBtn.addEventListener('click', () => categoryModal.style.display = 'none');

saveProductBtn.addEventListener('click', async () => {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const category = document.getElementById('productCategory').value;
    const quantity = document.getElementById('productQuantity').value;

    if (!name || !price || !category) return;

    const payload = {
        name,
        category,
        quantity: parseInt(quantity),
        price: parseFloat(price)
    };

    if (id) {
        await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } else {
        await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    productModal.style.display = 'none';
    loadProducts();
});

window.deleteProduct = async (id) => {
    if(confirm('Видалити цей товар?')) {
        await fetch(`/api/items/${id}`, { method: 'DELETE' });
        loadProducts();
    }
};

window.editProduct = async (id) => {
    const res = await fetch(`/api/items/${id}`);
    const item = await res.json();

    document.getElementById('modalTitle').textContent = '✏️ Змінити товар';
    document.getElementById('productId').value = item.id;
    document.getElementById('productName').value = item.name;
    document.getElementById('productPrice').value = item.price;
    document.getElementById('productCategory').value = item.category;
    document.getElementById('productQuantity').value = item.quantity;

    productModal.style.display = 'block';
};

document.getElementById('addCategoryBtn').addEventListener('click', async () => {
    const name = document.getElementById('newCategoryName').value;
    if(!name) return;
    await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: name })
    });
    document.getElementById('newCategoryName').value = '';
    await loadCategories();
});

document.getElementById('updateCategoryBtn').addEventListener('click', async () => {
    const id = document.getElementById('editCategorySelect').value;
    const name = document.getElementById('editCategoryName').value;
    if(!id || !name) return;
    await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: name })
    });
    document.getElementById('editCategoryName').value = '';
    await loadCategories();
    await loadProducts();
});

document.getElementById('deleteCategoryBtn').addEventListener('click', async () => {
    const id = document.getElementById('editCategorySelect').value;
    if(!id) return;
    if(confirm('Видалити категорію? Товари в ній залишаться без категорії.')) {
        await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        await loadCategories();
        await loadProducts();
    }
});

editCategorySelect.addEventListener('change', (e) => {
    const selectedText = e.target.options[e.target.selectedIndex].text;
    document.getElementById('editCategoryName').value = e.target.value ? selectedText : '';
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadProducts();
});