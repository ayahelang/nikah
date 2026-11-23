/**
 * 13 Template undangan yang bisa dipilih pelanggan
 * Diterapkan via data-theme / class di undangan.html
 */
const THEMES = [
  {
    id: 'classic',
    name: 'Classic Romance',
    desc: 'Elegan klasik, font serif lembut',
    colors: { primary: '#8b5a2b', accent: '#d4a574', bg: '#faf8f5', text: '#2c2c2c' }
  },
  {
    id: 'elegant',
    name: 'Elegant Gold',
    desc: 'Nuansa emas mewah',
    colors: { primary: '#b8860b', accent: '#f0e68c', bg: '#fffef8', text: '#3d3200' }
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    desc: 'Bersih, modern, tipografi kuat',
    colors: { primary: '#1a1a1a', accent: '#c9a86c', bg: '#ffffff', text: '#1a1a1a' }
  },
  {
    id: 'floral',
    name: 'Floral Soft',
    desc: 'Bunga pastel lembut',
    colors: { primary: '#c4787a', accent: '#e8b4b8', bg: '#fdf6f6', text: '#4a3030' }
  },
  {
    id: 'navy',
    name: 'Navy Formal',
    desc: 'Biru navy formal',
    colors: { primary: '#1b3a5f', accent: '#c9a227', bg: '#f4f7fb', text: '#1b2a3a' }
  },
  {
    id: 'garden',
    name: 'Garden Green',
    desc: 'Hijau taman alami',
    colors: { primary: '#2d5a3d', accent: '#a8c686', bg: '#f5f9f4', text: '#1e3326' }
  },
  {
    id: 'blush',
    name: 'Blush Pink',
    desc: 'Pink blush romantis',
    colors: { primary: '#d4a0a0', accent: '#f2d5d5', bg: '#fff9f9', text: '#5c4040' }
  },
  {
    id: 'ivory',
    name: 'Ivory Cream',
    desc: 'Krem gading lembut',
    colors: { primary: '#9c8b7a', accent: '#e8dcc8', bg: '#fbf8f3', text: '#3d352c' }
  },
  {
    id: 'midnight',
    name: 'Midnight Luxury',
    desc: 'Gelap mewah dengan aksen emas',
    colors: { primary: '#c9a227', accent: '#e8d48b', bg: '#0f0f12', text: '#f0e6d0' }
  },
  {
    id: 'terracotta',
    name: 'Terracotta Warm',
    desc: 'Hangat terracotta & tanah',
    colors: { primary: '#c45c26', accent: '#e8a87c', bg: '#faf6f1', text: '#3d2a1f' }
  },
  {
    id: 'sage',
    name: 'Sage Whisper',
    desc: 'Hijau sage tenang',
    colors: { primary: '#7d8b6f', accent: '#c5d1b8', bg: '#f7f8f5', text: '#2f352b' }
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    desc: 'Ungu lavender lembut',
    colors: { primary: '#7b6b8a', accent: '#c4b5d4', bg: '#f8f6fb', text: '#2e2838' }
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    desc: 'Biru laut segar',
    colors: { primary: '#2a6f8f', accent: '#7eb8d4', bg: '#f3f9fc', text: '#1a3340' }
  }
];

function getTheme(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

function applyTheme(themeId, rootEl) {
  const t = getTheme(themeId);
  const el = rootEl || document.documentElement;
  el.style.setProperty('--primary', t.colors.primary);
  el.style.setProperty('--accent', t.colors.accent);
  el.style.setProperty('--bg', t.colors.bg);
  el.style.setProperty('--text', t.colors.text);
  el.setAttribute('data-theme', t.id);
  return t;
}

// Export untuk browser
if (typeof window !== 'undefined') {
  window.THEMES = THEMES;
  window.getTheme = getTheme;
  window.applyTheme = applyTheme;
}
