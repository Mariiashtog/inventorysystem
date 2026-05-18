// ========== GLOBAL VARIABLES ==========
let jwtToken = localStorage.getItem('token');

// Helper function
const $ = (id) => document.getElementById(id);

// Modal elements
const productModal = $('productModal');
const categoryModal = $('categoryModal');
const loginModal = $('loginModal');
const basketModal = $('basketModal');

// ========== HELPER: FALLBACK IMAGES ==========
// Якщо в базі немає фото, беремо красиві картинки за назвою
function getFallbackImage(name) {
  if (!name) return '';
  const n = name.toLowerCase();
  if (n.includes('iphone') || n.includes('phone')) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop';
  if (n.includes('macbook') || n.includes('laptop')) return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop';
  if (n.includes('logitech') || n.includes('mouse')) return 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop';
  if (n.includes('samsung') || n.includes('monitor')) return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop';
  if (n.includes('keychron') || n.includes('keyboard')) return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop';
  if (n.includes('sony') || n.includes('headphone')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop';
  return '';
}

// ========== AUTH FUNCTIONS ==========
function updateAuthUI() {
  const show = !!jwtToken;
  if ($('basketBtn')) $('basketBtn').style.display = show ? 'flex' : 'none';
  if ($('logoutBtn')) $('logoutBtn').style.display = show ? 'flex' : 'none';
  if ($('openModalBtn')) $('openModalBtn').style.display = show ? 'flex' : 'none';
  if ($('openCatModalBtn')) $('openCatModalBtn').style.display = show ? 'flex' : 'none';
  if ($('loginBtn')) $('loginBtn').style.display = show ? 'none' : 'flex';
}

// ✅ ВИХІД З СИСТЕМИ
function logout() {
  console.log('🚪 Logging out...');
  jwtToken = null;
  localStorage.removeItem('token');
  updateAuthUI();
  loadProducts();
  alert('✅ Ви вийшли з системи');
}

// ✅ КНОПКА ВИХОДУ
if ($('logoutBtn')) {
  $('logoutBtn').onclick = () => {
    console.log('Logout button clicked!');
    logout();
  };
}

async function fetchWithAuth(url, options = {}) {
  if (jwtToken) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    };
  }
  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error('Unauthorized');
  }
  return res;
}

// ========== LOGIN ==========
if ($('loginBtn')) {
  $('loginBtn').onclick = () => {
    if (loginModal) loginModal.style.display = 'flex';
  };
}

if ($('closeLoginModalBtn')) {
  $('closeLoginModalBtn').onclick = () => {
    if (loginModal) loginModal.style.display = 'none';
  };
}

if ($('performLoginBtn')) {
  $('performLoginBtn').onclick = async () => {
    const username = $('loginUsername').value.trim();
    const password = $('loginPassword').value;

    if (!username || !password) {
      alert('❌ Введіть логін та пароль');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        jwtToken = data.token;
        localStorage.setItem('token', jwtToken);
        if (loginModal) loginModal.style.display = 'none';
        if ($('loginPassword')) $('loginPassword').value = '';
        updateAuthUI();
        await loadProducts();
        alert('✅ Успішний вхід!');
      } else {
        const err = await res.json();
        alert(' ' + (err.error || 'Невірний логін або пароль'));
      }
    } catch (e) {
      alert('❌ Помилка підключення: ' + e.message);
    }
  };
}

// ========== CATEGORIES ==========
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const cats = await res.json();

    if ($('categoryFilter')) $('categoryFilter').innerHTML = '<option value="">Всі категорії</option>';
    if ($('productCategory')) $('productCategory').innerHTML = '';
    if ($('editCategorySelect')) $('editCategorySelect').innerHTML = '<option value="">Оберіть категорію...</option>';

    cats.forEach(c => {
      const name = c.category_name || c.name;
      const id = c.idcategories || c.id;
      if ($('categoryFilter')) $('categoryFilter').innerHTML += `<option value="${name}">${name}</option>`;
      if ($('productCategory')) $('productCategory').innerHTML += `<option value="${name}">${name}</option>`;
      if ($('editCategorySelect')) $('editCategorySelect').innerHTML += `<option value="${id}">${name}</option>`;
    });
  } catch (e) {
    console.error('Categories error:', e);
  }
}

// ========== PRODUCTS ==========
async function loadProducts(search = '', category = '') {
  try {
    let url = '/api/products?';
    if (search) url += `name=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    const products = data.data || data || [];

    const container = $('productsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (products.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>Товарів не знайдено</h3>
        </div>`;
      return;
    }

    products.forEach(item => {
      const card = document.createElement('div');
      card.className = 'product-card';

      // ✅ ЛОГІКА ФОТО: Беремо з бази, якщо немає — підставляємо красиве за назвою
      const dbImage = item.image_url;
      const fallbackImage = getFallbackImage(item.name);
      const finalImage = (dbImage && dbImage !== 'null') ? dbImage : fallbackImage;

      const hasImage = !!finalImage;

      card.innerHTML = `
        <div class="product-image" style="${hasImage ? 'background: none;' : ''}">
          ${hasImage
          ? `<img src="${finalImage}" alt="${item.name}" style="width:100%; height:100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.parentElement.innerHTML='📦';">`
          : '📦'
      }
        </div>
        <div class="product-info">
          <h3 class="product-title">${item.name}</h3>
          <div class="product-meta">
            <div class="product-category">
              <span>📁</span>
              <span class="badge badge-category">${item.category || 'Без категорії'}</span>
            </div>
            <div class="product-quantity">
              <span>📊</span>
              <span class="badge badge-quantity">${item.quantity} шт.</span>
            </div>
          </div>
          <div class="product-price">${parseFloat(item.price).toFixed(2)} </div>
          <div class="product-actions">
            ${jwtToken ? `
              <button class="btn-action btn-add-cart" data-id="${item.id}">🛒 В кошик</button>
              <button class="btn-action btn-edit" data-id="${item.id}">✏️</button>
              <button class="btn-action btn-delete" data-id="${item.id}">🗑️</button>
            ` : `
              <button class="btn-action btn-add-cart" onclick="alert('🔐 Увійдіть в систему')" style="flex:1">🔐 Увійти</button>
            `}
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // Event delegation for buttons
    document.querySelectorAll('.btn-add-cart[data-id]').forEach(btn => {
      btn.onclick = () => addToBasket(parseInt(btn.dataset.id));
    });

    document.querySelectorAll('.btn-edit[data-id]').forEach(btn => {
      btn.onclick = () => editProduct(parseInt(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete[data-id]').forEach(btn => {
      btn.onclick = () => deleteProduct(parseInt(btn.dataset.id));
    });

  } catch (e) {
    console.error('Products error:', e);
    const container = $('productsContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Помилка завантаження</h3>
          <p>${e.message}</p>
        </div>`;
    }
  }
}

// ========== BASKET ==========
async function addToBasket(productId) {
  if (!jwtToken) {
    alert('🔐 Будь ласка, увійдіть в систему');
    return;
  }

  const qty = prompt('Введіть кількість:', '1');
  if (qty === null) return;

  const quantity = parseInt(qty);
  if (isNaN(quantity) || quantity <= 0) {
    alert(' Невірна кількість');
    return;
  }

  try {
    const res = await fetchWithAuth('/api/basket', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity })
    });

    const data = await res.json();
    if (res.ok || res.status === 201) {
      alert('✅ Додано в кошик!');
    } else {
      alert(' ' + (data.error || 'Помилка додавання'));
    }
  } catch (e) {
    alert('❌ Помилка: ' + e.message);
  }
}

if ($('basketBtn')) {
  $('basketBtn').onclick = async () => {
    if (basketModal) {
      basketModal.style.display = 'flex';
      await loadBasket();
    }
  };
}

if ($('closeBasketModalBtn')) {
  $('closeBasketModalBtn').onclick = () => {
    if (basketModal) basketModal.style.display = 'none';
  };
}

async function loadBasket() {
  try {
    const res = await fetchWithAuth('/api/basket');
    const items = await res.json();

    const container = $('basketItems');
    if (!container) return;
    container.innerHTML = '';

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem;color:var(--gray)">
          <div style="font-size:4rem;margin-bottom:1rem">🛒</div>
          <p>Кошик порожній</p>
        </div>`;
      return;
    }

    let total = 0;
    items.forEach(item => {
      const sum = item.quantity * item.price;
      total += sum;

      const div = document.createElement('div');
      div.className = 'basket-item';
      div.innerHTML = `
        <div style="flex:1">
          <strong style="font-size:1.1rem">${item.name}</strong>
          <div style="color:var(--gray);margin-top:0.5rem">
            ${item.quantity} шт. × ${parseFloat(item.price).toFixed(2)} ₴
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;font-size:1.2rem;color:var(--primary)">
            ${sum.toFixed(2)} ₴
          </div>
          <button class="btn-remove" data-id="${item.id}" 
                  style="margin-top:0.5rem;padding:0.5rem 1rem;background:var(--danger);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem">
            🗑️ Видалити
          </button>
        </div>
      `;
      container.appendChild(div);
    });

    const totalDiv = document.createElement('div');
    totalDiv.className = 'basket-total';
    totalDiv.innerHTML = `💰 Загальна сума: ${total.toFixed(2)} ₴`;
    container.appendChild(totalDiv);

    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.onclick = () => removeFromBasket(parseInt(btn.dataset.id));
    });

  } catch (e) {
    console.error('Basket error:', e);
  }
}

async function removeFromBasket(basketId) {
  if (!confirm('Видалити цей товар з кошика?')) return;
  try {
    await fetchWithAuth(`/api/basket/${basketId}`, { method: 'DELETE' });
    await loadBasket();
  } catch (e) {
    alert('❌ Помилка видалення');
  }
}

// ========== PRODUCT MODAL ==========
if ($('openModalBtn')) {
  $('openModalBtn').onclick = () => {
    if ($('modalTitle')) $('modalTitle').textContent = '➕ Новий товар';
    if ($('productId')) $('productId').value = '';
    if ($('productName')) $('productName').value = '';
    if ($('productPrice')) $('productPrice').value = '';
    if ($('productImage')) $('productImage').value = '';
    if ($('productQuantity')) $('productQuantity').value = '1';
    if ($('productCategory') && $('productCategory').options.length > 0) $('productCategory').selectedIndex = 0;
    if (productModal) productModal.style.display = 'flex';
  };
}

if ($('closeModalBtn')) {
  $('closeModalBtn').onclick = () => {
    if (productModal) productModal.style.display = 'none';
  };
}

if ($('saveProductBtn')) {
  $('saveProductBtn').onclick = async () => {
    const id = $('productId') ? $('productId').value : '';
    const name = $('productName') ? $('productName').value.trim() : '';
    const price = $('productPrice') ? parseFloat($('productPrice').value) : NaN;
    const image_url = $('productImage') ? $('productImage').value.trim() : '';
    const category = $('productCategory') ? $('productCategory').value : '';
    const quantity = $('productQuantity') ? parseInt($('productQuantity').value) : NaN;

    if (!name) { alert(' Введіть назву'); return; }
    if (isNaN(price)) { alert(' Введіть ціну'); return; }
    if (!category) { alert('❌ Оберіть категорію'); return; }
    if (isNaN(quantity)) { alert('❌ Введіть кількість'); return; }

    try {
      const url = id ? `/api/products/${id}` : '/api/products';
      const method = id ? 'PUT' : 'POST';

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify({ name, price, category, quantity, image_url: image_url || null })
      });

      if (res.ok) {
        if (productModal) productModal.style.display = 'none';
        await loadProducts();
        await loadCategories();
        alert(id ? '✅ Оновлено' : '✅ Додано');
      } else {
        const err = await res.json();
        alert('❌ ' + (err.error || 'Помилка'));
      }
    } catch (e) {
      alert(' ' + e.message);
    }
  };
}

async function editProduct(id) {
  if (!jwtToken) { alert(' Увійдіть'); return; }
  try {
    const res = await fetch(`/api/products/${id}`);
    const item = await res.json();

    if ($('modalTitle')) $('modalTitle').textContent = '✏️ Редагувати';
    if ($('productId')) $('productId').value = item.id;
    if ($('productName')) $('productName').value = item.name;
    if ($('productPrice')) $('productPrice').value = item.price;
    if ($('productImage')) $('productImage').value = item.image_url || '';
    if ($('productQuantity')) $('productQuantity').value = item.quantity;

    if ($('productCategory')) {
      for (let i = 0; i < $('productCategory').options.length; i++) {
        if ($('productCategory').options[i].value === item.category) {
          $('productCategory').selectedIndex = i;
          break;
        }
      }
    }

    if (productModal) productModal.style.display = 'flex';
  } catch (e) {
    alert('❌ Помилка');
  }
}

async function deleteProduct(id) {
  if (!confirm('Видалити?')) return;
  try {
    await fetchWithAuth(`/api/products/${id}`, { method: 'DELETE' });
    await loadProducts();
  } catch (e) {
    alert('❌ Помилка');
  }
}

// ========== CATEGORY MODAL ==========
if ($('openCatModalBtn')) $('openCatModalBtn').onclick = () => { if (categoryModal) categoryModal.style.display = 'flex'; };
if ($('closeCatModalBtn')) $('closeCatModalBtn').onclick = () => { if (categoryModal) categoryModal.style.display = 'none'; };

if ($('addCategoryBtn')) {
  $('addCategoryBtn').onclick = async () => {
    const name = $('newCategoryName') ? $('newCategoryName').value.trim() : '';
    if (!name) return;
    try {
      await fetchWithAuth('/api/categories', { method: 'POST', body: JSON.stringify({ category_name: name }) });
      if ($('newCategoryName')) $('newCategoryName').value = '';
      await loadCategories();
      await loadProducts();
    } catch (e) { alert('❌ Помилка'); }
  };
}

if ($('updateCategoryBtn')) {
  $('updateCategoryBtn').onclick = async () => {
    const id = $('editCategorySelect') ? $('editCategorySelect').value : '';
    const name = $('editCategoryName') ? $('editCategoryName').value.trim() : '';
    if (!id || !name) return;
    try {
      await fetchWithAuth(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify({ category_name: name }) });
      if ($('editCategoryName')) $('editCategoryName').value = '';
      await loadCategories();
    } catch (e) { alert('❌ Помилка'); }
  };
}

if ($('deleteCategoryBtn')) {
  $('deleteCategoryBtn').onclick = async () => {
    const id = $('editCategorySelect') ? $('editCategorySelect').value : '';
    if (!id || !confirm('Видалити?')) return;
    try {
      await fetchWithAuth(`/api/categories/${id}`, { method: 'DELETE' });
      await loadCategories();
    } catch (e) { alert('❌ Помилка'); }
  };
}

if ($('editCategorySelect')) {
  $('editCategorySelect').onchange = (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    if ($('editCategoryName')) $('editCategoryName').value = e.target.value ? opt.text : '';
  };
}

// ========== FILTERS ==========
if ($('searchInput')) $('searchInput').oninput = (e) => loadProducts(e.target.value, $('categoryFilter') ? $('categoryFilter').value : '');
if ($('categoryFilter')) $('categoryFilter').onchange = (e) => loadProducts($('searchInput') ? $('searchInput').value : '', e.target.value);
if ($('resetFiltersBtn')) {
  $('resetFiltersBtn').onclick = () => {
    if ($('searchInput')) $('searchInput').value = '';
    if ($('categoryFilter')) $('categoryFilter').value = '';
    loadProducts();
  };
}

// ========== CLOSE MODALS ==========
[productModal, categoryModal, loginModal, basketModal].forEach(modal => {
  if (modal) modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
});

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
  updateAuthUI();
  await loadCategories();
  await loadProducts();
  console.log('✅ App ready');
});