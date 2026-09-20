function flash(type, msg) {
  qs('#flash').innerHTML = `<div class="flash ${type}">${escapeHtml(msg)}</div>`;
}

qs('#register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = qs('#name').value.trim();
  const email = qs('#email').value.trim();
  const password = qs('#password').value;
  const { ok, data } = await api.post('/api/register', { name, email, password });
  if (!ok) {
    flash('error', data.error || 'Registration failed');
    return;
  }
  window.location.href = '/';
});
