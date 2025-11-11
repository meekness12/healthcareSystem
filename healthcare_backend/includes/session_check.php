<?php
// includes/session_check.php
require_once __DIR__ . '/../config/headers.php';
session_start();

function require_auth() {
  if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
  }
}

function require_role($roles) {
  require_auth();
  $allowed = is_array($roles) ? $roles : [$roles];
  if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], $allowed, true)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
  }
}
