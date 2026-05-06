// ============================================
// api.js — API helper, auth & utils
// ============================================

const API_BASE = '../backend/api';

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

    if (res.status === 401) {
      Auth.logout();
      return null;
    }

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
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================
// Cart count badge
// ============================================
async function updateCartBadge() {
  const badge = document.querySelectorAll('.cart-badge');
  if (!badge.length || !Auth.isLoggedIn()) return;

  const res = await apiRequest('cart.php?action=list');
  if (res?.success) {
    badge.forEach(b => b.textContent = res.data.count || '');
  }
}

// ============================================
// Navbar rendering
// ============================================
function renderNavbar() {
  const user = Auth.getUser();
  const isLoggedIn = Auth.isLoggedIn();
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const navHtml = `
    <nav class="navbar">
      <a href="index.html" class="navbar-brand">Lanika<span>Store</span></a>

      <div class="navbar-search">
        <svg class="icon-search" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" id="searchInput" placeholder="Cari produk..." />
      </div>

      <div class="navbar-actions">
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Keluar
          </button>
        ` : `
          <a href="login.html" class="btn btn-primary btn-sm">Masuk</a>
        `}
      </div>
    </nav>
  `;

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

      // Pre-fill from URL
      const params = new URLSearchParams(window.location.search);
      if (params.has('search')) searchInput.value = params.get('search');
    }
  }

  if (isLoggedIn) updateCartBadge();
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
  const price = formatRupiah(product.price);
  const stockText = product.stock === 0 ? 'Habis' : product.stock < 10 ? `Sisa ${product.stock}` : 'Tersedia';
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
          <button class="btn btn-primary btn-sm" style="flex:1"
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
  const labels = {
    pending:    'Menunggu',
    processing: 'Diproses',
    shipped:    'Dikirim',
    delivered:  'Selesai',
    cancelled:  'Dibatalkan',
  };
  return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
}

// Initialize navbar on load
document.addEventListener('DOMContentLoaded', renderNavbar);
