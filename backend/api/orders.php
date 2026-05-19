<?php
// ============================================
// Orders API — /api/orders.php
// POST ?action=create  — buat order baru
// GET  ?action=list    — daftar order user
// GET  ?action=detail&id=x — detail order
// POST ?action=cancel&id=x — batalkan order
// ============================================

require_once __DIR__ . '/../config/database.php';

$user   = requireAuth();
$action = $_GET['action'] ?? 'list';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$userId = $user['id'];

switch ($action) {
    case 'create': handleCreate($userId, $body); break;
    case 'list':   handleList($userId);          break;
    case 'detail': handleDetail($userId);        break;
    case 'cancel': handleCancel($userId);        break;
    default:       respondError('Action tidak valid.', 404);
}

// ============================================
// Buat order dari isi cart
// ============================================
function handleCreate(int $userId, array $body): void {
    $name    = trim($body['shipping_name'] ?? '');
    $phone   = trim($body['shipping_phone'] ?? '');
    $address = trim($body['shipping_address'] ?? '');
    $city    = trim($body['shipping_city'] ?? '');
    $notes   = trim($body['notes'] ?? '');

    if (!$name || !$phone || !$address || !$city)
        respondError('Data pengiriman (nama, telepon, alamat, kota) wajib diisi.');

    $db = getDB();

    // Ambil isi cart
    $stmt = $db->prepare("
        SELECT c.product_id, c.quantity, p.price, p.stock, p.name AS product_name
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ");
    $stmt->execute([$userId]);
    $cartItems = $stmt->fetchAll();

    if (empty($cartItems)) respondError('Cart kosong. Tidak dapat membuat order.');

    // Validasi stok dan hitung total
    $total = 0;
    foreach ($cartItems as $item) {
        if ($item['stock'] < $item['quantity'])
            respondError("Stok produk '{$item['product_name']}' tidak mencukupi.");
        $total += $item['price'] * $item['quantity'];
    }

    $db->beginTransaction();
    try {
        // Buat order
        $stmt = $db->prepare("
            INSERT INTO orders (user_id, total_amount, shipping_name, shipping_phone, shipping_address, shipping_city, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $total, $name, $phone, $address, $city, $notes]);
        $orderId = (int) $db->lastInsertId();

        // Insert order items & kurangi stok
        $insertItem  = $db->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
        $updateStock = $db->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

        foreach ($cartItems as $item) {
            $insertItem->execute([$orderId, $item['product_id'], $item['quantity'], $item['price']]);
            $updateStock->execute([$item['quantity'], $item['product_id']]);
        }

        // Kosongkan cart
        $db->prepare("DELETE FROM cart WHERE user_id = ?")->execute([$userId]);

        $db->commit();
        respond(true, 'Order berhasil dibuat!', ['order_id' => $orderId, 'total' => $total], 201);
    } catch (Exception $e) {
        $db->rollBack();
        respondError('Gagal membuat order: ' . $e->getMessage(), 500);
    }
}

// ============================================
// Daftar order milik user
// ============================================
function handleList(int $userId): void {
    $db   = getDB();
    $stmt = $db->prepare("
        SELECT o.id, o.total_amount, o.status, o.shipping_city, o.created_at,
               COUNT(oi.id) AS item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ");
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll();

    foreach ($orders as &$o) {
        $o['total_amount'] = (float) $o['total_amount'];
        $o['item_count']   = (int) $o['item_count'];
    }

    respond(true, 'OK', $orders);
}

// ============================================
// Detail order
// ============================================
function handleDetail(int $userId): void {
    $orderId = (int) ($_GET['id'] ?? 0);
    if (!$orderId) respondError('ID order diperlukan.');

    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch();
    if (!$order) respondError('Order tidak ditemukan.', 404);

    $itemStmt = $db->prepare("
        SELECT oi.*, p.name, p.image_url, p.slug
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    ");
    $itemStmt->execute([$orderId]);
    $items = $itemStmt->fetchAll();

    $order['total_amount'] = (float) $order['total_amount'];
    foreach ($items as &$item) {
        $item['price']    = (float) $item['price'];
        $item['quantity'] = (int) $item['quantity'];
        $item['subtotal'] = $item['price'] * $item['quantity'];
    }

    respond(true, 'OK', ['order' => $order, 'items' => $items]);
}

// ============================================
// Batalkan order (hanya jika masih pending)
// ============================================
function handleCancel(int $userId): void {
    $orderId = (int) ($_GET['id'] ?? 0);
    if (!$orderId) respondError('ID order diperlukan.');

    $db   = getDB();
    $stmt = $db->prepare("SELECT id, status FROM orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch();

    if (!$order) respondError('Order tidak ditemukan.', 404);
    if ($order['status'] !== 'pending') respondError('Hanya order dengan status pending yang dapat dibatalkan.');

    // Kembalikan stok
    $items = $db->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?")->execute([$orderId]);
    $itemStmt = $db->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
    $itemStmt->execute([$orderId]);
    $items = $itemStmt->fetchAll();

    $db->beginTransaction();
    try {
        foreach ($items as $item) {
            $db->prepare("UPDATE products SET stock = stock + ? WHERE id = ?")->execute([$item['quantity'], $item['product_id']]);
        }
        $db->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$orderId]);
        $db->commit();
        respond(true, 'Order berhasil dibatalkan.');
    } catch (Exception $e) {
        $db->rollBack();
        respondError('Gagal membatalkan order.', 500);
    }
}
