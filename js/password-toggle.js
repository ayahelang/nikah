/**
 * Toggle show/hide password — pakai di semua form password
 * Cara pakai HTML:
 * <div class="pw-wrap">
 *   <input type="password" id="password" ...>
 *   <button type="button" class="pw-toggle" aria-label="Tampilkan password">👁</button>
 * </div>
 */
(function () {
  function enhance(input) {
    if (!input || input.dataset.pwEnhanced) return;
    input.dataset.pwEnhanced = '1';

    let wrap = input.parentElement;
    if (!wrap.classList.contains('pw-wrap')) {
      wrap = document.createElement('div');
      wrap.className = 'pw-wrap';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
    }

    if (wrap.querySelector('.pw-toggle')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-toggle';
    btn.setAttribute('aria-label', 'Tampilkan password');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    wrap.appendChild(btn);

    btn.addEventListener('click', function () {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
      btn.innerHTML = show
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    });
  }

  function init() {
    document.querySelectorAll('input[type="password"]').forEach(enhance);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Style sekali
  if (!document.getElementById('pw-toggle-style')) {
    const s = document.createElement('style');
    s.id = 'pw-toggle-style';
    s.textContent = `
      .pw-wrap { position: relative; display: block; width: 100%; }
      .pw-wrap input { width: 100%; padding-right: 44px !important; box-sizing: border-box; }
      .pw-toggle {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer; padding: 4px;
        color: #888; line-height: 0; display: flex; align-items: center;
      }
      .pw-toggle:hover { color: #8b5a2b; }
    `;
    document.head.appendChild(s);
  }
})();
