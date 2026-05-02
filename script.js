const productsContainer = document.getElementById('productsContainer');
const productModal = document.getElementById('productModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const saveProductBtn = document.getElementById('saveProductBtn');

async function loadProducts() {
    try {
        const response = await fetch('/api/items');
        const data = await response.json();

        productsContainer.innerHTML = '';

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'product-card';

            const category = item.category ? item.category : 'Без категорії';

            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>Категорія: ${category}</p>
                <p>Кількість: ${item.quantity} шт.</p>
                <div class="price"><strong>${item.price} ₴</strong></div>
            `;

            productsContainer.appendChild(card);
        });
    } catch (error) {
        console.error(error);
    }
}

if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
        productModal.style.display = 'block';
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        productModal.style.display = 'none';
    });
}

if (saveProductBtn) {
    saveProductBtn.addEventListener('click', async () => {
        const name = document.getElementById('productName').value;
        const price = document.getElementById('productPrice').value;
        const desc = document.getElementById('productDesc').value;

        if (!name || !price) return;

        await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                category: 'Новинка',
                quantity: 1,
                price: parseFloat(price)
            })
        });

        productModal.style.display = 'none';
        loadProducts();
    });
}

document.addEventListener('DOMContentLoaded', loadProducts);