-- ============================================
-- E-Commerce Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    stock INT DEFAULT 0,
    image_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cart_item (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_name VARCHAR(100) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- Seed Data
-- ============================================

-- Categories
INSERT INTO categories (name, slug) VALUES
('Elektronik', 'elektronik'),
('Fashion', 'fashion'),
('Rumah & Taman', 'rumah-taman'),
('Olahraga', 'olahraga'),
('Kecantikan', 'kecantikan');

-- Admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@toko.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Sample products
INSERT INTO products (category_id, name, slug, description, price, stock, image_url, is_featured) VALUES
(1, 'Headphone Bluetooth Pro X1', 'headphone-bluetooth-pro-x1', 'Headphone wireless premium dengan noise cancelling aktif, bass yang dalam, dan baterai tahan 30 jam. Desain ergonomis untuk kenyamanan sepanjang hari.', 850000, 50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', TRUE),
(1, 'Smartwatch Series 5', 'smartwatch-series-5', 'Jam tangan pintar dengan monitor detak jantung, GPS built-in, layar AMOLED, dan ketahanan air 50 meter. Kompatibel dengan iOS dan Android.', 1250000, 30, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', TRUE),
(1, 'Speaker Portable Mini Bass', 'speaker-portable-mini-bass', 'Speaker portabel tahan air IPX7 dengan suara 360° yang menggelegar. Baterai 20 jam dan dapat dihubungkan ke dua perangkat sekaligus.', 450000, 80, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', FALSE),
(2, 'Kemeja Batik Premium Pria', 'kemeja-batik-premium-pria', 'Kemeja batik tulis Solo dengan motif parang klasik. Bahan katun halus yang nyaman dipakai seharian. Tersedia berbagai ukuran M-XXL.', 320000, 100, 'https://images.unsplash.com/photo-1594938298603-c8148c4b4a8c?w=500', TRUE),
(2, 'Tas Kulit Wanita Elegan', 'tas-kulit-wanita-elegan', 'Tas bahu dari kulit sintetis premium dengan desain modern. Dilengkapi banyak kompartemen dan tali yang dapat disesuaikan.', 580000, 40, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', TRUE),
(3, 'Lampu LED Smart Home', 'lampu-led-smart-home', 'Lampu LED pintar yang bisa dikontrol via smartphone. 16 juta pilihan warna, jadwal otomatis, dan kompatibel dengan Google Home & Alexa.', 180000, 200, 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=500', FALSE),
(3, 'Teko Listrik Stainless 1.8L', 'teko-listrik-stainless-1.8l', 'Teko listrik dengan material stainless steel food grade. Auto shut-off, indikator air, dan didih hanya 3 menit. Kapasitas 1.8 liter.', 210000, 120, 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=500', FALSE),
(4, 'Sepatu Running Ultralight', 'sepatu-running-ultralight', 'Sepatu lari dengan teknologi foam ultra-ringan dan sol anti-selip. Desain breathable untuk kenyamanan maksimal saat berolahraga.', 695000, 60, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', TRUE),
(5, 'Set Skincare Brightening', 'set-skincare-brightening', 'Paket perawatan wajah lengkap: toner, serum vitamin C, dan moisturizer. Diformulasikan untuk mencerahkan dan melembabkan kulit.', 425000, 75, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500', TRUE),
(1, 'USB Hub 7-in-1 Multiport', 'usb-hub-7-in-1-multiport', 'Hub USB multifungsi dengan port USB-C, USB 3.0, HDMI 4K, SD card reader, dan port ethernet. Transfer data hingga 5Gbps.', 275000, 90, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500', FALSE);
