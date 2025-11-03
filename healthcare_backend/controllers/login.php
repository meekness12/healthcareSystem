<?php
require_once __DIR__ . '/../config/db_connect.php';
session_start();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
    exit;
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email format']);
    exit;
}

// Check if user exists
$stmt = $conn->prepare("SELECT user_id, name, password, role FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Email not registered']);
    exit;
}

$stmt->bind_result($user_id, $name, $hashedPassword, $role);
$stmt->fetch();

// Verify password
if (!password_verify($password, $hashedPassword)) {
    echo json_encode(['status' => 'error', 'message' => 'Incorrect password']);
    exit;
}

// Save session data
$_SESSION['user_id'] = $user_id;
$_SESSION['name'] = $name;
$_SESSION['role'] = $role;

// Return JSON with role for frontend redirection
echo json_encode([
    'status' => 'success',
    'message' => 'Login successful',
    'role' => $role,
    'user_id' => $user_id,
    'name' => $name
]);

$stmt->close();
$conn->close();
