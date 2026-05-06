<?php
// ============================================
// Cart API — /api/cart.php
// GET  ?action=list   — tampilkan cart
// POST ?action=add    — tambah ke cart
// POST ?action=update — update quantity
// POST ?action=remove — hapus item
// POST ?action=clear  — kosongkan cart
// ============================================

require_once __DIR__ . '/../config/database.php';

$user   = requireAuth();
$action = $_GET['action'] ?? 'list';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$userId = $user['id'];

switch ($action) {
    case 'list':   handleList($userId);        break;
    case 'add':    handleAdd($userId, $body);  break;
    case 'update': handleUpdate($userId, $body); break;
    case 'remove': handleRemove($userId, $body); break;
    case 'clear':  handleClear($userId);       break;
    default:       respondError('Action tidak valid.', 404);
}

// ============================================
// Ambil cart beserta detail produk
// ============================================
function handleList(int $userId): void {
    $db   = getDB();
    $stmt = $db->prepare("
        SELECT c.id, c.quantity, c.product_id,
               p.name, p.slug, p.price, p.stock, p.image_url
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    ");
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();

    $total = 0;
    foreach ($items as &$item) {
        $item['price']    = (float) $item['price'];
        $item['quantity'] = (int) $item['quantity'];
        $item['subtotal'] = $item['price'] * $item['quantity'];
        $total += $item['subtotal'];
    }

    respond(true, 'OK', ['items' => $items, 'total' => $total, 'count' => count($items)]);
}

// ============================================
// Tambah produk ke cart
// ============================================
function handleAdd(int $userId, array $body): void {
    $productId = (int) ($body['product_id'] ?? 0);
    $quantity  = max(1, (int) ($body['quantity'] ?? 1));

    if (!$productId) respondError('product_id diperlukan.');

    $db = getDB();

    // Cek produk ada dan stok cukup
    $stmt = $db->prepare('SELECT id, stock FROM products WHERE id = ?');
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    if (!$product) respondError('Produk tidak ditemukan.', 404);
    if ($product['stock'] < $quantity) respondError('Stok tidak mencukupi.');

    // Cek apakah sudah ada di cart
    $stmt = $db->prepare('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?');
    $stmt->execute([$userId, $productId]);
    $existing = $stmt->fetch();

    if ($existing) {
        $newQty = $existing['quantity'] + $quantity;
        if ($product['stock'] < $newQty) respondError('Stok tidak mencukupi.');
        $db->prepare('UPDATE cart SET quantity = ? WHERE id = ?')->execute([$newQty, $existing['id']]);
        respond(true, 'Jumlah produk di cart diperbarui.');
    } else {
        $db->prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)')->execute([$userId, $productId, $quantity]);
        respond(true, 'Produk ditambahkan ke cart.', null, 201);
    }
}

// ============================================
// Update quantity
// ============================================
function handleUpdate(int $userId, array $body): void {
    $cartId   = (int) ($body['cart_id'] ?? 0);
    $quantity = (int) ($body['quantity'] ?? 0);

    if (!$cartId || $quantity < 1) respondError('cart_id dan quantity (≥1) diperlukan.');

    $db   = getDB();
    $stmt = $db->prepare('SELECT c.id, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.user_id = ?');
    $stmt->execute([$cartId, $userId]);
    $item = $stmt->fetch();

    if (!$item) respondError('Item cart tidak ditemukan.', 404);
    if ($item['stock'] < $quantity) respondError('Stok tidak mencukupi.');

    $db->prepare('UPDATE cart SET quantity = ? WHERE id = ?')->execute([$quantity, $cartId]);
    respond(true, 'Cart diperbarui.');
}

// ============================================
// Hapus item dari cart
// ============================================
function handleRemove(int $userId, array $body): void {
    $cartId = (int) ($body['cart_id'] ?? 0);
    if (!$cartId) respondError('cart_id diperlukan.');

    $db   = getDB();
    $stmt = $db->prepare('DELETE FROM cart WHERE id = ? AND user_id = ?');
    $stmt->execute([$cartId, $userId]);

    if ($stmt->rowCount() === 0) respondError('Item cart tidak ditemukan.', 404);
    respond(true, 'Item dihapus dari cart.');
}

// ============================================
// Kosongkan seluruh cart
// ============================================
function handleClear(int $userId): void {
    $db = getDB();
    $db->prepare('DELETE FROM cart WHERE user_id = ?')->execute([$userId]);
    respond(true, 'Cart dikosongkan.');
}
