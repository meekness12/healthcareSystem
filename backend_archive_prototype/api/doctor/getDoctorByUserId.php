<?php
require_once __DIR__ . "/../../config/headers.php";
require_once __DIR__ . "/../../config/db_connect.php"; // assumes $mysqli

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
if ($user_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid user_id"]);
    exit;
}

$sql = "
  SELECT d.doctor_id, d.user_id, u.name AS name, d.specialty, d.department, d.room, d.max_daily_appointments
  FROM doctors d
  JOIN users u ON d.user_id = u.user_id
  WHERE d.user_id = ?
  LIMIT 1
";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success"=>false,"message"=>"Prepare failed: ".$mysqli->error]);
    exit;
}
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();
$doctor = $res->fetch_assoc();
if (!$doctor) {
    echo json_encode(["success"=>false,"message"=>"Doctor not found"]);
} else {
    echo json_encode(["success"=>true,"doctor"=>$doctor]);
}
$stmt->close();
$mysqli->close();
