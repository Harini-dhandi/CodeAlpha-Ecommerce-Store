// Small fetch wrapper shared by every page.
const api = {
  async get(url) {
    const res = await fetch(url, { credentials: 'include' });
    return { ok: res.ok, status: res.status, data: await res.json() };
  },
  async post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  },
};

function money(n) {
  return '$' + Number(n).toFixed(2);
}

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

// Renders the login/logout + cart-count area of the header on every page.
async function refreshHeader() {
  const [{ data: user }, { data: cart }] = await Promise.all([api.get('/api/me'), api.get('/api/cart')]);

  const authArea = qs('#auth-area');
  if (authArea) {
    if (user) {
      authArea.innerHTML = `
        <a href="/orders.html">My Orders</a>
        <span>Hi, ${escapeHtml(user.name.split(' ')[0])}</span>
        <a href="#" id="logout-link">Logout</a>
      `;
      const logoutLink = qs('#logout-link', authArea);
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await api.post('/api/logout');
        window.location.href = '/';
      });
    } else {
      authArea.innerHTML = `<a href="/login.html">Login</a><a href="/register.html">Register</a>`;
    }
  }

  const cartCount = qs('#cart-count');
  if (cartCount) {
    cartCount.textContent = cart.count || 0;
    cartCount.style.display = cart.count ? 'inline-block' : 'none';
  }
  return user;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', refreshHeader);
