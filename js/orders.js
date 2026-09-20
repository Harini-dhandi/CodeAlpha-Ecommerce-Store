async function load() {
  const user = await refreshHeader();
  if (!user) {
    qs('#orders-root').innerHTML = `
      <div class="empty-state">
        <p>Please log in to view your orders.</p>
        <a class="btn btn-primary" href="/login.html?next=/orders.html">Log in</a>
      </div>`;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const placedId = params.get('placed');
  if (placedId) {
    qs('#flash').innerHTML = `<div class="flash success">Order ${escapeHtml(placedId)} placed successfully! 🎉</div>`;
  }

  const { data: orders } = await api.get('/api/orders');
  renderOrders(orders);
}

function renderOrders(orders) {
  const root = qs('#orders-root');
  if (orders.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <p>You haven't placed any orders yet.</p>
        <a class="btn btn-primary" href="/">Start shopping</a>
      </div>`;
    return;
  }
  root.innerHTML = orders
    .slice()
    .reverse()
    .map(
      (o) => `
    <div class="order-card">
      <div class="order-head">
        <span class="order-id">${escapeHtml(o.id)}</span>
        <span class="badge">${escapeHtml(o.status)}</span>
      </div>
      <div style="color:var(--muted); font-size:0.85rem; margin-bottom:8px;">
        Placed ${new Date(o.createdAt).toLocaleString()} · Shipping to: ${escapeHtml(o.shippingAddress)}
      </div>
      <ul>
        ${o.items.map((i) => `<li>${i.qty} × ${escapeHtml(i.name)} — ${money(i.subtotal)}</li>`).join('')}
      </ul>
      <div style="text-align:right; font-weight:700; margin-top:8px;">Total: ${money(o.total)}</div>
    </div>`
    )
    .join('');
}

load();
