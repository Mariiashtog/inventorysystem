const productsContainer = document.getElementById('productsContainer');
const productModal = document.getElementById('productModal');
const categoryModal = document.getElementById('categoryModal');
const loginModal = document.getElementById('loginModal');
const basketModal = document.getElementById('basketModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const openCatModalBtn = document.getElementById('openCatModalBtn');
const closeCatModalBtn = document.getElementById('closeCatModalBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const categoryFilter = document.getElementById('categoryFilter');
const productCategory = document.getElementById('productCategory');
const editCategorySelect = document.getElementById('editCategorySelect');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const basketBtn = document.getElementById('basketBtn');
const performLoginBtn = document.getElementById('performLoginBtn');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
const closeBasketModalBtn = document.getElementById('closeBasketModalBtn');
const basketItemsContainer = document.getElementById('basketItems');

let jwtToken = localStorage.getItem('token');

function updateAuthUI() {
    if (jwtToken) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        basketBtn.style.display = 'block';
        openModalBtn.style.display = 'block';
        openCatModalBtn.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        basketBtn.style.display = 'none';
        openModalBtn.style.display = 'none';
        openCatModalBtn.style.display = 'none';
    }
}

async function fetchWithAuth(url, options = {}) {
    if (jwtToken) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${jwtToken}`
        };
    }
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Unauthorized');
    }
    return response;
}

function logout() {
    jwtToken = null;
    localStorage.removeItem('token');
    updateAuthUI();
    loadProducts();
}

loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
closeLoginModalBtn.addEventListener('click', () => loginModal.style.display = 'none');
logoutBtn.addEventListener('click', logout);
basketBtn.addEventListener('click', () => {
    basketModal.style.display = 'block';
    loadBasket();
});
closeBasketModalBtn.addEventListener('click', () => basketModal.style.display = 'none');

performLoginBtn.addEventListener('click', async () => {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            jwtToken = data.token;
            localStorage.setItem('token', jwtToken);
            loginModal.style.display = 'none';
            document.getElementById('loginPassword').value = '';
            updateAuthUI();
            loadProducts();
        } else {
            alert('Помилка');
        }
    } catch (e) {
        console.error(e);
    }
});

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();

        categoryFilter.innerHTML = '<option value="">Всі категорії</option>';
        productCategory.innerHTML = '';
        editCategorySelect.innerHTML = '<option value="">Оберіть...</option>';

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

            let actionButtons = '';
            if (jwtToken) {
                actionButtons = `
                    <div style="display: flex; gap: 8px; margin-top: 15px;">
                        <button onclick="addToBasket(${item.id})" style="padding: 6px; cursor: pointer; border: 1px solid #3b82f6; border-radius: 4px; background: white; color: #3b82f6;">🛒 В кошик</button>
                        <button onclick="editProduct(${item.id})" style="padding: 6px; cursor: pointer; border: 1px solid #ddd; border-radius: 4px; background: white;">✏️</button>
                        <button onclick="deleteProduct(${item.id})" style="padding: 6px; cursor: pointer; border: 1px solid #ff4d4f; border-radius: 4px; background: white; color: #ff4d4f;">🗑️</button>
                    </div>
                `;
            }

            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>Категорія: ${catName}</p>
                <p>Кількість: ${item.quantity} шт.</p>
                <div class="price"><strong>${item.price} ₴</strong></div>
                ${actionButtons}
            `;
            productsContainer.appendChild(card);
        });
    } catch (error) {
        console.error(error);
    }
}

window.addToBasket = async (id) => {
    const qtyStr = prompt('Введіть кількість:', '1');
    if (qtyStr === null) return;

    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) {
        alert('Невірна кількість');
        return;
    }

    try {
        const res = await fetchWithAuth('/api/basket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: id, quantity: qty })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Помилка при додаванні');
        } else {
            alert('Додано в кошик');
        }
    } catch (e) {
        console.error(e);
    }
};

async function loadBasket() {
    try {
        const res = await fetchWithAuth('/api/basket');
        const data = await res.json();
        basketItemsContainer.innerHTML = '';

        if (data.length === 0) {
            basketItemsContainer.innerHTML = '<p>Кошик порожній</p>';
            return;
        }

        let totalSum = 0;

        data.forEach(item => {
            const itemTotal = item.quantity * item.price;
            totalSum += itemTotal;

            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.style.padding = '10px';
            div.style.border = '1px solid #ddd';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';

            div.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    ${item.quantity} шт. × ${item.price} ₴ = <strong>${itemTotal} ₴</strong>
                </div>
                <button onclick="removeFromBasket(${item.id})" style="color: red; border: none; background: none; cursor: pointer;">Видалити</button>
            `;
            basketItemsContainer.appendChild(div);
        });

        const totalDiv = document.createElement('div');
        totalDiv.style.marginTop = '15px';
        totalDiv.style.paddingTop = '10px';
        totalDiv.style.borderTop = '2px solid #333';
        totalDiv.style.textAlign = 'right';
        totalDiv.innerHTML = `<h3>Загальна сума: ${totalSum} ₴</h3>`;
        basketItemsContainer.appendChild(totalDiv);

    } catch (e) {
        console.error(e);
    }
}

window.removeFromBasket = async (id) => {
    try {
        await fetchWithAuth(`/api/basket/${id}`, { method: 'DELETE' });
        loadBasket();
    } catch (e) {
        console.error(e);
    }
};

document.getElementById('searchInput').addEventListener('input', (e) => loadProducts(e.target.value, categoryFilter.value));
categoryFilter.addEventListener('change', (e) => loadProducts(document.getElementById('searchInput').value, e.target.value));
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

    const payload = { name, category, quantity: parseInt(quantity), price: parseFloat(price) };

    try {
        if (id) {
            await fetchWithAuth(`/api/items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
            await fetchWithAuth('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        productModal.style.display = 'none';
        loadProducts();
    } catch (e) {
        console.error(e);
    }
});

window.deleteProduct = async (id) => {
    if(confirm('Видалити?')) {
        try {
            await fetchWithAuth(`/api/items/${id}`, { method: 'DELETE' });
            loadProducts();
        } catch (e) {
            console.error(e);
        }
    }
};

window.editProduct = async (id) => {
    const res = await fetch(`/api/items/${id}`);
    const item = await res.json();
    document.getElementById('modalTitle').textContent = '✏️ Змінити';
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
    try {
        await fetchWithAuth('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_name: name }) });
        document.getElementById('newCategoryName').value = '';
        await loadCategories();
    } catch (e) {
        console.error(e);
    }
});

document.getElementById('updateCategoryBtn').addEventListener('click', async () => {
    const id = document.getElementById('editCategorySelect').value;
    const name = document.getElementById('editCategoryName').value;
    if(!id || !name) return;
    try {
        await fetchWithAuth(`/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_name: name }) });
        document.getElementById('editCategoryName').value = '';
        await loadCategories();
        await loadProducts();
    } catch (e) {
        console.error(e);
    }
});

document.getElementById('deleteCategoryBtn').addEventListener('click', async () => {
    const id = document.getElementById('editCategorySelect').value;
    if(!id) return;
    if(confirm('Видалити?')) {
        try {
            await fetchWithAuth(`/api/categories/${id}`, { method: 'DELETE' });
            await loadCategories();
            await loadProducts();
        } catch (e) {
            console.error(e);
        }
    }
});

editCategorySelect.addEventListener('change', (e) => {
    const selectedText = e.target.options[e.target.selectedIndex].text;
    document.getElementById('editCategoryName').value = e.target.value ? selectedText : '';
});

document.addEventListener('DOMContentLoaded', async () => {
    updateAuthUI();
    await loadCategories();
    await loadProducts();
});