<?php
function jsonResponse($success, $message, $data = null) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

function sanitize($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}
