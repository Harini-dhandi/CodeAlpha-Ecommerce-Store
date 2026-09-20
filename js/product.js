const id = new URLSearchParams(window.location.search).get('id');

qs('#search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = qs('#search-input').value.trim();
  window.location.href = q ? `/?q=${encodeURIComponent(q)}` : '/';
});

async function load() {
  if (!id) {
    qs('#product-root').innerHTML = '<p>Product not specified.</p>';
    return;
  }
  const { ok, data } = await api.get(`/api/products/${encodeURIComponent(id)}`);
  if (!ok) {
    qs('#product-root').innerHTML = '<p>Product not found.</p>';
    return;
  }
  render(data);
}

function render(p) {
  qs('#product-root').innerHTML = `
    <div class="product-detail">
      <img src="${p.image}" alt="${escapeHtml(p.name)}" />
      <div>
        <div class="cat">${escapeHtml(p.category)}</div>
        <h1>${escapeHtml(p.name)}</h1>
        <div class="price">${money(p.price)}</div>
        <p class="desc">${escapeHtml(p.description)}</p>
        <div class="qty-row">
          <label for="qty">Qty:</label>
          <input type="number" id="qty" value="1" min="1" max="${p.stock}" ${p.stock === 0 ? 'disabled' : ''} />
          <button class="btn btn-primary" id="add-btn" ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Out of stock' : 'Add to Cart'}
          </button>
        </div>
        <div class="stock-note">${p.stock > 0 ? `${p.stock} in stock` : 'Currently unavailable'}</div>
      </div>
    </div>
  `;

  const addBtn = qs('#add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const qty = parseInt(qs('#qty').value, 10) || 1;
      addBtn.disabled = true;
      addBtn.textContent = 'Adding…';
      await api.post('/api/cart/add', { productId: p.id, qty });
      await refreshHeader();
      addBtn.textContent = 'Added ✓';
      setTimeout(() => {
        addBtn.textContent = 'Add to Cart';
        addBtn.disabled = false;
      }, 900);
    });
  }
}

load();
