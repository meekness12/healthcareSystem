<?php
// Allow React frontend to communicate
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

// Show PHP errors temporarily (for debugging)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once "../config/db_connect.php"; // adjust path if needed

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
    exit;
}

// Get JSON body
$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$role = trim($data['role'] ?? '');

if (!$name || !$email || !$password || !$role) {
    echo json_encode(["status" => "error", "message" => "All fields are required"]);
    exit;
}

// Check if email already exists
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "Email already registered"]);
    exit;
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert user
$stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $name, $email, $hashedPassword, $role);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Registration successful"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to register user"]);
}

$stmt->close();
$conn->close();
?>
