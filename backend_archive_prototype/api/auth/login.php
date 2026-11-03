<?php
require_once __DIR__ . "/../../config/headers.php";
session_start();
include_once __DIR__ . "/../../config/db_connect.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid input."]);
    exit;
}

$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = trim($data['password'] ?? '');

if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Email and password are required."]);
    exit;
}

// Find user by email
$stmt = $mysqli->prepare("SELECT user_id, name, email, password, role, created_at FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
    exit;
}

$user = $result->fetch_assoc();

// Verify password
if (!password_verify($password, $user['password'])) {
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
    exit;
}

// Set session
$_SESSION['user_id'] = (int)$user['user_id'];
$_SESSION['name'] = $user['name'];
$_SESSION['role'] = $user['role'];

// Remove sensitive data before sending
unset($user['password']);

echo json_encode([
    "success" => true,
    "message" => "Login successful.",
    "user" => $user
]);
?>
