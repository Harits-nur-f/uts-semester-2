# LanikaStore — E-Commerce Website

Website toko online lengkap dengan **PHP + MySQL** (backend) dan **HTML/CSS/Vanilla JS** (frontend).

---

## 📁 Struktur Folder

```
ecommerce/
├── backend/
│   ├── config/
│   │   └── database.php       # Konfigurasi DB & helper JWT
│   └── api/
│       ├── auth.php           # Register, Login, Me
│       ├── products.php       # CRUD Produk & Kategori
│       ├── cart.php           # Keranjang Belanja
│       └── orders.php         # Pemesanan
├── frontend/
│   ├── css/
│   │   └── style.css          # Stylesheet utama
│   ├── js/
│   │   └── api.js             # Helper API, Auth, Toast, Utils
│   ├── index.html             # Halaman utama (produk, filter, search)
│   ├── product.html           # Detail produk
│   ├── cart.html              # Keranjang belanja
│   ├── checkout.html          # Halaman checkout
│   ├── login.html             # Login & Registrasi
│   └── orders.html            # Riwayat pesanan
└── schema.sql                 # Struktur & data awal database
```

---

## ⚙️ Persyaratan

- **PHP** >= 8.1
- **MySQL** >= 5.7 atau MariaDB >= 10.4
- **Web Server**: Apache (XAMPP/LAMPP) atau PHP built-in server

---

## 🚀 Cara Instalasi

### 1. Clone / Copy Project

```bash
# Salin folder ecommerce ke dalam htdocs (XAMPP) atau www (LAMPP)
cp -r ecommerce /xampp/htdocs/
```

### 2. Import Database

```bash
# Via MySQL CLI
mysql -u root -p < schema.sql

# atau buka phpMyAdmin → Import → pilih schema.sql
```

### 3. Konfigurasi Database

Edit file `backend/config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');        // Username MySQL Anda
define('DB_PASS', '');            // Password MySQL Anda
define('DB_NAME', 'ecommerce_db');
define('JWT_SECRET', 'ganti-dengan-string-acak-panjang'); // Wajib diganti!
```

### 4. Jalankan

**Opsi A — XAMPP:**
1. Pastikan Apache & MySQL sudah Running
2. Buka browser: `http://localhost/ecommerce/frontend/`

**Opsi B — PHP Built-in Server:**
```bash
cd ecommerce
php -S localhost:8000 -t .
# Akses: http://localhost:8000/frontend/
```

---

## 👤 Akun Default

| Role    | Email             | Password   |
|---------|-------------------|------------|
| Admin   | admin@toko.com    | password   |
| Customer| (daftar sendiri)  | —          |

> **Catatan:** Password admin di schema.sql menggunakan hash `password_hash()`. Ganti password setelah login pertama.

---

## 🔌 API Endpoints

### Auth (`/backend/api/auth.php`)
| Method | Param            | Deskripsi         |
|--------|------------------|-------------------|
| POST   | ?action=login    | Login             |
| POST   | ?action=register | Registrasi        |
| GET    | ?action=me       | Info user (auth)  |

### Products (`/backend/api/products.php`)
| Method | Param                        | Deskripsi              |
|--------|------------------------------|------------------------|
| GET    | ?action=list                 | Semua produk           |
| GET    | ?action=list&search=xxx      | Cari produk            |
| GET    | ?action=list&category=1      | Filter kategori        |
| GET    | ?action=list&sort=price_asc  | Urutkan harga          |
| GET    | ?action=featured             | Produk unggulan        |
| GET    | ?action=categories           | Semua kategori         |
| GET    | ?action=detail&slug=xxx      | Detail produk          |
| POST   | ?action=create [admin]       | Tambah produk          |
| POST   | ?action=update&id=x [admin]  | Edit produk            |
| POST   | ?action=delete&id=x [admin]  | Hapus produk           |

### Cart (`/backend/api/cart.php`) — *Perlu login*
| Method | Param            | Deskripsi            |
|--------|------------------|----------------------|
| GET    | ?action=list     | Lihat keranjang      |
| POST   | ?action=add      | Tambah ke keranjang  |
| POST   | ?action=update   | Update quantity      |
| POST   | ?action=remove   | Hapus item           |
| POST   | ?action=clear    | Kosongkan keranjang  |

### Orders (`/backend/api/orders.php`) — *Perlu login*
| Method | Param             | Deskripsi        |
|--------|-------------------|------------------|
| POST   | ?action=create    | Buat pesanan     |
| GET    | ?action=list      | Daftar pesanan   |
| GET    | ?action=detail&id | Detail pesanan   |
| POST   | ?action=cancel&id | Batalkan pesanan |

---

## ✨ Fitur

- ✅ Registrasi & Login dengan JWT
- ✅ Browsing produk dengan search, filter kategori, sort, pagination
- ✅ Halaman detail produk dengan related products
- ✅ Keranjang belanja (add, update qty, remove, clear)
- ✅ Checkout & pembuatan pesanan
- ✅ Riwayat pesanan & detail pesanan
- ✅ Pembatalan pesanan (status pending)
- ✅ UI responsif (mobile-friendly)
- ✅ Notifikasi toast
- ✅ Loading skeleton

---

## 🔒 Keamanan

- Password di-hash dengan `password_hash()` (bcrypt)
- Autentikasi menggunakan JWT (HS256)
- Query database menggunakan **PDO prepared statements** (anti SQL Injection)
- Input validation di backend

---

## 🛠 Pengembangan Lanjutan

Beberapa fitur yang bisa ditambahkan:
- Upload gambar produk
- Sistem ulasan & rating produk  
- Dashboard admin lengkap
- Integrasi payment gateway (Midtrans/Xendit)
- Notifikasi email (PHPMailer)
- Kupon/diskon
- Wishlist

---

*LanikaStore — Dibuat dengan ❤ di Indonesia*
