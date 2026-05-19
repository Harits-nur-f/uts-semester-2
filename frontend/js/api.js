// ============================================
// api.js — API helper, auth & utils
// ============================================

const API_BASE = 'http://localhost/humairastore/backend/api/';

// ============================================
// Auth helpers
// ============================================
const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser:  () => JSON.parse(localStorage.getItem('user') || 'null'),
  isLoggedIn: () => !!localStorage.getItem('token'),

  login(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  },

  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};

// ============================================
// API request wrapper
// ============================================
async function apiRequest(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (res.status === 401) { Auth.logout(); return null; }
    return data;
  } catch (err) {
    console.error('API Error:', err);
    showToast('Terjadi kesalahan koneksi.', 'error');
    return null;
  }
}

// ============================================
// Format helpers
// ============================================
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'Baru saja';
  if (diff < 3600)  return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return formatDate(dateStr);
}

// ============================================
// Toast notifications
// ============================================
function showToast(message, type = 'success', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================
// Cart count badge
// ============================================
async function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  if (!badges.length || !Auth.isLoggedIn()) return;
  const res = await apiRequest('cart.php?action=list');
  if (res?.success) {
    badges.forEach(b => b.textContent = res.data.count || '');
  }
}

// ============================================
// Navbar rendering — dengan hamburger mobile
// ============================================
function renderNavbar() {
  const user = Auth.getUser();
  const isLoggedIn = Auth.isLoggedIn();
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const navHtml = `
    <nav class="navbar">
      <a href="index.html" class="navbar-brand">Humaira<span> Store</span></a>

      <div class="navbar-search">
        <svg class="icon-search" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" id="searchInput" placeholder="Cari produk..." />
      </div>

      <!-- Desktop actions -->
      <div class="navbar-actions desktop-nav">
        <a href="index.html" class="nav-link ${currentPage === 'index.html' ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Beranda
        </a>
        <a href="cart.html" class="nav-link ${currentPage === 'cart.html' ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Keranjang
          ${isLoggedIn ? '<span class="cart-badge">0</span>' : ''}
        </a>
        ${isLoggedIn ? `
          <a href="orders.html" class="nav-link ${currentPage === 'orders.html' ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Pesanan
          </a>
          <button class="btn btn-ghost btn-sm" onclick="Auth.logout()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Keluar
          </button>
        ` : `
          <a href="login.html" class="btn btn-primary btn-sm">Masuk</a>
        `}
      </div>

      <!-- Mobile: cart icon + hamburger -->
      <div class="mobile-nav">
        ${isLoggedIn ? `
          <a href="cart.html" class="mobile-cart-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span class="cart-badge">0</span>
          </a>
        ` : ''}
        <button class="hamburger-btn" onclick="toggleMobileMenu()" id="hamburgerBtn" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <!-- Mobile dropdown menu -->
    <div class="mobile-menu" id="mobileMenu">
      ${isLoggedIn ? `
        <div class="mobile-menu-user">
          <div class="mobile-menu-avatar">${(user?.name || 'U')[0].toUpperCase()}</div>
          <div>
            <div class="mobile-menu-name">${user?.name || ''}</div>
            <div class="mobile-menu-email">${user?.email || ''}</div>
          </div>
        </div>
        <div class="mobile-menu-divider"></div>
      ` : ''}

      <a href="index.html" class="mobile-menu-item ${currentPage === 'index.html' ? 'active' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Beranda
      </a>
      <a href="cart.html" class="mobile-menu-item ${currentPage === 'cart.html' ? 'active' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        Keranjang
        ${isLoggedIn ? '<span class="cart-badge" style="margin-left:auto;">0</span>' : ''}
      </a>

      ${isLoggedIn ? `
        <a href="orders.html" class="mobile-menu-item ${currentPage === 'orders.html' ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Pesanan Saya
        </a>
        <div class="mobile-menu-divider"></div>
        <button class="mobile-menu-item danger" onclick="Auth.logout()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Keluar
        </button>
      ` : `
        <div class="mobile-menu-divider"></div>
        <a href="login.html" class="mobile-menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Masuk / Daftar
        </a>
      `}
    </div>

    <!-- Overlay untuk tutup menu -->
    <div class="mobile-menu-overlay" id="menuOverlay" onclick="toggleMobileMenu()"></div>
  `;

  // Tambahkan CSS mobile navbar ke head (sekali saja)
  if (!document.getElementById('mobile-nav-css')) {
    const style = document.createElement('style');
    style.id = 'mobile-nav-css';
    style.textContent = `
      /* Desktop nav tampil, mobile nav sembunyi */
      .desktop-nav { display: flex; align-items: center; gap: 0.25rem; margin-left: auto; }
      .mobile-nav  { display: none; align-items: center; gap: 0.5rem; margin-left: auto; }

      /* Hamburger button */
      .hamburger-btn {
        width: 38px; height: 38px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 5px; cursor: pointer; padding: 0;
      }
      .hamburger-btn span {
        display: block; width: 18px; height: 2px;
        background: var(--text-primary);
        border-radius: 2px;
        transition: all 0.25s ease;
      }
      .hamburger-btn.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      .hamburger-btn.open span:nth-child(2) { opacity: 0; }
      .hamburger-btn.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

      /* Mobile cart button */
      .mobile-cart-btn {
        position: relative;
        width: 38px; height: 38px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius);
        display: flex; align-items: center; justify-content: center;
        color: var(--text-secondary);
      }
      .mobile-cart-btn svg { width: 18px; height: 18px; }
      .mobile-cart-btn .cart-badge {
        position: absolute; top: -5px; right: -5px;
        font-size: 0.58rem; min-width: 16px; height: 16px;
      }

      /* Dropdown menu */
      .mobile-menu {
        display: none;
        position: fixed;
        top: 54px; right: 0;
        width: 260px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-top: none;
        border-radius: 0 0 var(--radius-lg) var(--radius-lg);
        z-index: 99;
        padding: 0.5rem;
        box-shadow: var(--shadow-lg);
        animation: menuSlideIn 0.2s ease;
      }
      .mobile-menu.open { display: block; }

      @keyframes menuSlideIn {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* User info di atas menu */
      .mobile-menu-user {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.75rem 0.5rem;
      }
      .mobile-menu-avatar {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: var(--accent);
        color: var(--bg-primary);
        font-weight: 700; font-size: 0.9rem;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .mobile-menu-name  { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
      .mobile-menu-email { font-size: 0.72rem; color: var(--text-muted); }

      /* Menu items */
      .mobile-menu-item {
        display: flex; align-items: center; gap: 0.75rem;
        width: 100%; padding: 0.7rem 0.75rem;
        border-radius: var(--radius);
        font-size: 0.875rem; font-weight: 500;
        color: var(--text-secondary);
        background: none; border: none;
        cursor: pointer; text-decoration: none;
        transition: all 0.2s;
      }
      .mobile-menu-item svg    { width: 17px; height: 17px; flex-shrink: 0; }
      .mobile-menu-item:hover  { background: var(--bg-secondary); color: var(--text-primary); }
      .mobile-menu-item.active { color: var(--accent); background: rgba(201,150,62,0.08); }
      .mobile-menu-item.danger { color: var(--danger); }
      .mobile-menu-item.danger:hover { background: rgba(192,57,43,0.1); }

      .mobile-menu-divider {
        height: 1px; background: var(--border-subtle);
        margin: 0.35rem 0;
      }

      /* Overlay gelap di belakang menu */
      .mobile-menu-overlay {
        display: none;
        position: fixed; inset: 0;
        z-index: 98;
        background: rgba(0,0,0,0.5);
      }
      .mobile-menu-overlay.open { display: block; }

      /* Switch desktop/mobile */
      @media (max-width: 768px) {
        .desktop-nav { display: none !important; }
        .mobile-nav  { display: flex !important; }
        .mobile-menu { top: 54px; }
      }
    `;
    document.head.appendChild(style);
  }

  const navContainer = document.getElementById('navbar-container');
  if (navContainer) {
    navContainer.innerHTML = navHtml;

    // Search handler
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
      const params = new URLSearchParams(window.location.search);
      if (params.has('search')) searchInput.value = params.get('search');
    }

    // Tutup menu saat klik di luar
    document.addEventListener('click', (e) => {
      const menu   = document.getElementById('mobileMenu');
      const btn    = document.getElementById('hamburgerBtn');
      const overlay = document.getElementById('menuOverlay');
      if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        menu.classList.remove('open');
        btn.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
      }
    });
  }

  if (isLoggedIn) updateCartBadge();
}

// Toggle mobile menu
function toggleMobileMenu() {
  const menu    = document.getElementById('mobileMenu');
  const btn     = document.getElementById('hamburgerBtn');
  const overlay = document.getElementById('menuOverlay');
  if (!menu) return;
  const isOpen = menu.classList.toggle('open');
  btn?.classList.toggle('open', isOpen);
  overlay?.classList.toggle('open', isOpen);
}

// ============================================
// Skeleton cards
// ============================================
function renderSkeletonGrid(container, count = 8) {
  container.innerHTML = Array(count).fill(`
    <div class="skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text-sm"></div>
    </div>
  `).join('');
}

// ============================================
// Product card renderer
// ============================================
function renderProductCard(product) {
  const price      = formatRupiah(product.price);
  const stockText  = product.stock === 0 ? 'Habis' : product.stock < 10 ? `Sisa ${product.stock}` : 'Tersedia';
  const stockClass = product.stock === 0 ? 'low' : product.stock < 10 ? 'low' : '';

  return `
    <div class="product-card" onclick="window.location.href='product.html?slug=${product.slug}'">
      <div class="product-image">
        <img src="${product.image_url || 'https://via.placeholder.com/400x300/1a1915/c9963e?text=No+Image'}" alt="${product.name}" loading="lazy" />
        ${product.is_featured ? '<span class="badge-featured">Unggulan</span>' : ''}
      </div>
      <div class="product-info">
        <div class="product-category">${product.category_name || ''}</div>
        <div class="product-name">${product.name}</div>
        <div class="product-price">${price}</div>
        <div class="product-stock ${stockClass}">${stockText}</div>
        <div class="product-actions">
          <button class="btn btn-primary btn-sm btn-flex"
            onclick="event.stopPropagation(); addToCart(${product.id})"
            ${product.stock === 0 ? 'disabled' : ''}>
            + Keranjang
          </button>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); window.location.href='product.html?slug=${product.slug}'">
            Detail
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// Add to cart (global)
// ============================================
async function addToCart(productId, quantity = 1) {
  if (!Auth.requireLogin()) return;
  const res = await apiRequest('cart.php?action=add', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  if (res?.success) {
    showToast('Produk ditambahkan ke keranjang! 🛒', 'success');
    updateCartBadge();
  } else {
    showToast(res?.message || 'Gagal menambahkan ke keranjang.', 'error');
  }
}

// ============================================
// Status badge
// ============================================
function statusBadge(status) {
  const labels = { pending:'Menunggu', processing:'Diproses', shipped:'Dikirim', delivered:'Selesai', cancelled:'Dibatalkan' };
  return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
}

// Initialize navbar on load
document.addEventListener('DOMContentLoaded', renderNavbar);
