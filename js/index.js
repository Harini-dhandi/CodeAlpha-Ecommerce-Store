let allProducts = [];
let activeCategory = 'All';

async function loadProducts(query = '') {
  const url = query ? `/api/products?q=${encodeURIComponent(query)}` : '/api/products';
  const { data } = await api.get(url);
  allProducts = data;
  renderFilters();
  renderGrid();
}

function renderFilters() {
  const categories = ['All', ...new Set(allProducts.map((p) => p.category))];
  const el = qs('#filters');
  el.innerHTML = categories
    .map((c) => `<button data-cat="${c}" class="${c === activeCategory ? 'active' : ''}">${c}</button>`)
    .join('');
  qsa('button', el).forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid() {
  const list = activeCategory === 'All' ? allProducts : allProducts.filter((p) => p.category === activeCategory);
  const grid = qs('#product-grid');
  if (list.length === 0) {
    grid.innerHTML = `<p>No products found.</p>`;
    return;
  }
  grid.innerHTML = list
    .map(
      (p) => `
    <div class="card">
      <a href="/product.html?id=${p.id}"><img src="${p.image}" alt="${escapeHtml(p.name)}" /></a>
      <div class="card-body">
        <span class="cat">${escapeHtml(p.category)}</span>
        <h3><a href="/product.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
        <span class="price">${money(p.price)}</span>
        <button class="btn btn-primary btn-block add-btn" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
          ${p.stock === 0 ? 'Out of stock' : 'Add to Cart'}
        </button>
      </div>
    </div>`
    )
    .join('');

  qsa('.add-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Adding…';
      await api.post('/api/cart/add', { productId: btn.dataset.id, qty: 1 });
      await refreshHeader();
      btn.textContent = 'Added ✓';
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.disabled = false;
      }, 900);
    });
  });
}

qs('#search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = qs('#search-input').value.trim();
  activeCategory = 'All';
  loadProducts(q);
});

loadProducts();
