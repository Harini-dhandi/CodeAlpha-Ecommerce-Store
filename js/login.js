function flash(type, msg) {
  qs('#flash').innerHTML = `<div class="flash ${type}">${escapeHtml(msg)}</div>`;
}

qs('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = qs('#email').value.trim();
  const password = qs('#password').value;
  const { ok, data } = await api.post('/api/login', { email, password });
  if (!ok) {
    flash('error', data.error || 'Login failed');
    return;
  }
  const params = new URLSearchParams(window.location.search);
  window.location.href = params.get('next') || '/';
});
