<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include_once "../../config/db_connect.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid input."]);
    exit;
}

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$role = trim($data['role'] ?? 'patient');

if (empty($name) || empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

// Check for existing email
$stmt = $mysqli->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email already registered."]);
    exit;
}

// Hash password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert user
$stmt = $mysqli->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $name, $email, $hashed_password, $role);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Registration successful."]);
} else {
    echo json_encode(["success" => false, "message" => "Server error. Please try again."]);
}
?>
