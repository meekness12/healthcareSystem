<?php
require_once __DIR__ . '/../../config/headers.php';
session_start();

$response = [
  'success' => true,
  'authenticated' => isset($_SESSION['user_id']),
  'user' => null,
];

if (isset($_SESSION['user_id'])) {
  $response['user'] = [
    'user_id' => (int)$_SESSION['user_id'],
    'name' => $_SESSION['name'] ?? null,
    'role' => $_SESSION['role'] ?? null,
  ];
}

echo json_encode($response);
