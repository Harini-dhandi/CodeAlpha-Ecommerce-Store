qs('#search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = qs('#search-input').value.trim();
  window.location.href = q ? `/?q=${encodeURIComponent(q)}` : '/';
});

function flash(type, msg) {
  qs('#flash').innerHTML = `<div class="flash ${type}">${escapeHtml(msg)}</div>`;
}

async function loadCart() {
  const { data: cart } = await api.get('/api/cart');
  renderCart(cart);
}

function renderCart(cart) {
  const root = qs('#cart-root');
  if (cart.items.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <p>Your cart is empty.</p>
        <a class="btn btn-primary" href="/">Browse products</a>
      </div>`;
    return;
  }

  root.innerHTML = `
    <table class="cart-table">
      <thead>
        <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr>
      </thead>
      <tbody>
        ${cart.items
          .map(
            (i) => `
          <tr data-id="${i.productId}">
            <td><span class="cart-item-name"><img src="${i.image}" alt=""> ${escapeHtml(i.name)}</span></td>
            <td>${money(i.price)}</td>
            <td><input type="number" class="qty-input" min="1" max="${i.stock}" value="${i.qty}" data-id="${i.productId}"></td>
            <td>${money(i.subtotal)}</td>
            <td><button class="btn btn-danger remove-btn" data-id="${i.productId}">Remove</button></td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="cart-summary">
      <div class="row"><span>Items</span><span>${cart.count}</span></div>
      <div class="row total"><span>Total</span><span>${money(cart.total)}</span></div>
      <div class="field" style="margin-top:16px;">
        <label for="shipping">Shipping address</label>
        <textarea id="shipping" rows="3" placeholder="Street, city, postal code"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="checkout-btn">Place Order</button>
    </div>
  `;

  qsa('.qty-input').forEach((input) => {
    input.addEventListener('change', async () => {
      const { data } = await api.post('/api/cart/update', { productId: input.dataset.id, qty: input.value });
      renderCart(data);
      refreshHeader();
    });
  });

  qsa('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { data } = await api.post('/api/cart/remove', { productId: btn.dataset.id });
      renderCart(data);
      refreshHeader();
    });
  });

  qs('#checkout-btn').addEventListener('click', async () => {
    const user = await refreshHeader();
    if (!user) {
      flash('error', 'Please log in before placing an order.');
      setTimeout(() => (window.location.href = '/login.html?next=/cart.html'), 1000);
      return;
    }
    const shippingAddress = qs('#shipping').value.trim();
    if (!shippingAddress) {
      flash('error', 'Please enter a shipping address.');
      return;
    }
    const btn = qs('#checkout-btn');
    btn.disabled = true;
    btn.textContent = 'Placing order…';
    const { ok, data } = await api.post('/api/orders/checkout', { shippingAddress });
    if (!ok) {
      flash('error', data.error || 'Could not place order.');
      btn.disabled = false;
      btn.textContent = 'Place Order';
      return;
    }
    window.location.href = `/orders.html?placed=${data.id}`;
  });
}

loadCart();
