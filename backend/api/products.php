<?php
// ============================================
// Products API — /api/products.php
// GET  ?action=list   — semua produk (+ filter & search)
// GET  ?action=detail&slug=xxx — detail produk
// GET  ?action=featured — produk unggulan
// GET  ?action=categories — semua kategori
// POST ?action=create  [admin] — tambah produk
// POST ?action=update&id=x [admin] — edit produk
// POST ?action=delete&id=x [admin] — hapus produk
// ============================================

require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'list':       handleList();                   break;
    case 'detail':     handleDetail();                 break;
    case 'featured':   handleFeatured();               break;
    case 'categories': handleCategories();             break;
    case 'create':     handleCreate($body);            break;
    case 'update':     handleUpdate($body);            break;
    case 'delete':     handleDelete();                 break;
    default:           respondError('Action tidak valid.', 404);
}

// ============================================
// List semua produk
// ============================================
function handleList(): void {
    $db       = getDB();
    $search   = trim($_GET['search'] ?? '');
    $category = (int) ($_GET['category'] ?? 0);
    $sort     = $_GET['sort'] ?? 'newest';
    $page     = max(1, (int) ($_GET['page'] ?? 1));
    $limit    = 12;
    $offset   = ($page - 1) * $limit;

    $where  = ['1=1'];
    $params = [];

    if ($search) {
        $where[]  = '(p.name LIKE ? OR p.description LIKE ?)';
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    if ($category > 0) {
        $where[]  = 'p.category_id = ?';
        $params[] = $category;
    }

    $orderBy = match ($sort) {
        'price_asc'  => 'p.price ASC',
        'price_desc' => 'p.price DESC',
        'name_asc'   => 'p.name ASC',
        default      => 'p.created_at DESC',
    };

    $whereStr = implode(' AND ', $where);

    // Count total
    $countStmt = $db->prepare("SELECT COUNT(*) FROM products p WHERE $whereStr");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    // Fetch products
    $stmt = $db->prepare("
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE $whereStr
        ORDER BY $orderBy
        LIMIT $limit OFFSET $offset
    ");
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    foreach ($products as &$p) {
        $p['price'] = (float) $p['price'];
        $p['stock'] = (int) $p['stock'];
        $p['is_featured'] = (bool) $p['is_featured'];
    }

    respond(true, 'OK', [
        'products'   => $products,
        'total'      => $total,
        'page'       => $page,
        'totalPages' => ceil($total / $limit),
    ]);
}

// ============================================
// Detail produk by slug
// ============================================
function handleDetail(): void {
    $slug = trim($_GET['slug'] ?? '');
    if (!$slug) respondError('Slug produk diperlukan.');

    $db   = getDB();
    $stmt = $db->prepare("
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ?
    ");
    $stmt->execute([$slug]);
    $product = $stmt->fetch();

    if (!$product) respondError('Produk tidak ditemukan.', 404);

    $product['price']      = (float) $product['price'];
    $product['stock']      = (int) $product['stock'];
    $product['is_featured'] = (bool) $product['is_featured'];

    // Related products (same category)
    $relStmt = $db->prepare("
        SELECT id, name, slug, price, image_url
        FROM products
        WHERE category_id = ? AND id != ?
        LIMIT 4
    ");
    $relStmt->execute([$product['category_id'], $product['id']]);
    $related = $relStmt->fetchAll();

    respond(true, 'OK', ['product' => $product, 'related' => $related]);
}

// ============================================
// Featured products
// ============================================
function handleFeatured(): void {
    $db   = getDB();
    $stmt = $db->prepare("
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_featured = TRUE
        ORDER BY p.created_at DESC
        LIMIT 6
    ");
    $stmt->execute();
    $products = $stmt->fetchAll();

    foreach ($products as &$p) {
        $p['price']      = (float) $p['price'];
        $p['stock']      = (int) $p['stock'];
        $p['is_featured'] = (bool) $p['is_featured'];
    }

    respond(true, 'OK', $products);
}

// ============================================
// Categories
// ============================================
function handleCategories(): void {
    $db   = getDB();
    $stmt = $db->prepare("
        SELECT c.*, COUNT(p.id) AS product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id
        ORDER BY c.name
    ");
    $stmt->execute();
    respond(true, 'OK', $stmt->fetchAll());
}

// ============================================
// Create product [admin only]
// ============================================
function handleCreate(array $body): void {
    $user = requireAuth();
    if ($user['role'] !== 'admin') respondError('Akses ditolak.', 403);

    $name        = trim($body['name'] ?? '');
    $description = trim($body['description'] ?? '');
    $price       = (float) ($body['price'] ?? 0);
    $stock       = (int) ($body['stock'] ?? 0);
    $categoryId  = (int) ($body['category_id'] ?? 0);
    $imageUrl    = trim($body['image_url'] ?? '');
    $isFeatured  = (bool) ($body['is_featured'] ?? false);

    if (!$name || $price <= 0) respondError('Nama dan harga produk wajib diisi.');

    $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $name)) . '-' . time();

    $db   = getDB();
    $stmt = $db->prepare("
        INSERT INTO products (category_id, name, slug, description, price, stock, image_url, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$categoryId ?: null, $name, $slug, $description, $price, $stock, $imageUrl, $isFeatured]);

    respond(true, 'Produk berhasil ditambahkan.', ['id' => (int) $db->lastInsertId()], 201);
}

// ============================================
// Update product [admin only]
// ============================================
function handleUpdate(array $body): void {
    $user = requireAuth();
    if ($user['role'] !== 'admin') respondError('Akses ditolak.', 403);

    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) respondError('ID produk diperlukan.');

    $db   = getDB();
    $stmt = $db->prepare("SELECT id FROM products WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) respondError('Produk tidak ditemukan.', 404);

    $fields = [];
    $params = [];
    $allowed = ['name', 'description', 'price', 'stock', 'category_id', 'image_url', 'is_featured'];

    foreach ($allowed as $field) {
        if (isset($body[$field])) {
            $fields[] = "$field = ?";
            $params[] = $body[$field];
        }
    }

    if (empty($fields)) respondError('Tidak ada data yang diperbarui.');

    $params[] = $id;
    $db->prepare("UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

    respond(true, 'Produk berhasil diperbarui.');
}

// ============================================
// Delete product [admin only]
// ============================================
function handleDelete(): void {
    $user = requireAuth();
    if ($user['role'] !== 'admin') respondError('Akses ditolak.', 403);

    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) respondError('ID produk diperlukan.');

    $db   = getDB();
    $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) respondError('Produk tidak ditemukan.', 404);
    respond(true, 'Produk berhasil dihapus.');
}
