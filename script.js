 const API_URL = 'http://localhost:3000/api/items';

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('productModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const saveBtn = document.getElementById('saveProductBtn');
    const container = document.getElementById('productsContainer');

    const loadProducts = async () => {
        try {
            const res = await fetch(API_URL);
            const products = await res.json();
            render(products);
        } catch (error) {
            console.error(error);
        }
    };

    const render = (products) => {
        container.innerHTML = '';
        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state">Товарів поки немає</div>';
            return;
        }
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-img">📦</div>
                <div class="badge">${p.category || 'Новинка'}</div>
                <div class="product-title">${p.name}</div>
                <div class="product-price">${p.price} грн</div>
                <div class="product-desc">В наявності: ${p.quantity || 1} шт.</div>
            `;
            container.appendChild(card);
        });
    };

    openBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('productName').value;
        const price = document.getElementById('productPrice').value;
        const desc = document.getElementById('productDesc').value;

        if (!name) return;

        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    price: Number(price) || 0,
                    category: desc || 'Без категорії',
                    quantity: 1
                })
            });

            modal.style.display = 'none';
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productDesc').value = '';
            loadProducts();
        } catch (error) {
            console.error(error);
        }
    });

    loadProducts();
});