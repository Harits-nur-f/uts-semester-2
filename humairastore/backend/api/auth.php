<?php
// ============================================
// Auth API — /api/auth.php
// POST /api/auth.php?action=register
// POST /api/auth.php?action=login
// GET  /api/auth.php?action=me
// ============================================

require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'register': handleRegister($body); break;
    case 'login':    handleLogin($body);    break;
    case 'me':       handleMe();            break;
    default:         respondError('Action tidak valid.', 404);
}

// ============================================
// Register
// ============================================
function handleRegister(array $body): void {
    $name     = trim($body['name'] ?? '');
    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$name || !$email || !$password)
        respondError('Nama, email, dan password wajib diisi.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))
        respondError('Format email tidak valid.');
    if (strlen($password) < 6)
        respondError('Password minimal 6 karakter.');

    $db = getDB();

    // Cek email sudah terdaftar
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) respondError('Email sudah terdaftar.', 409);

    $hashed = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    $stmt->execute([$name, $email, $hashed]);
    $userId = (int) $db->lastInsertId();

    $token = jwtEncode([
        'id'    => $userId,
        'name'  => $name,
        'email' => $email,
        'role'  => 'customer',
        'exp'   => time() + (7 * 24 * 3600), // 7 hari
    ]);

    respond(true, 'Registrasi berhasil!', [
        'token' => $token,
        'user'  => ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => 'customer'],
    ], 201);
}

// ============================================
// Login
// ============================================
function handleLogin(array $body): void {
    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$email || !$password)
        respondError('Email dan password wajib diisi.');

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password']))
        respondError('Email atau password salah.', 401);

    $token = jwtEncode([
        'id'    => $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role'],
        'exp'   => time() + (7 * 24 * 3600),
    ]);

    respond(true, 'Login berhasil!', [
        'token' => $token,
        'user'  => [
            'id'    => $user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role'],
        ],
    ]);
}

// ============================================
// Get current user
// ============================================
function handleMe(): void {
    $user = requireAuth();
    unset($user['exp']);
    respond(true, 'OK', $user);
}
