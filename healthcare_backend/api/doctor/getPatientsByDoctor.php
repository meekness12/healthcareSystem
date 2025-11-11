<?php
require_once __DIR__ . "/../../config/headers.php";
require_once __DIR__ . "/../../config/db_connect.php";

$doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 0;
if ($doctor_id <= 0) {
    echo json_encode(["success"=>false,"message"=>"Invalid doctor_id"]);
    exit;
}

$sql = "
  SELECT DISTINCT p.patient_id, u.name AS patient_name, p.dob, p.gender, p.insurance_provider
  FROM appointments a
  JOIN patients p ON a.patient_id = p.patient_id
  JOIN users u ON p.user_id = u.user_id
  WHERE a.doctor_id = ?
  ORDER BY u.name ASC
";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success"=>false,"message"=>"Prepare failed: ".$mysqli->error]);
    exit;
}
$stmt->bind_param("i", $doctor_id);
$stmt->execute();
$res = $stmt->get_result();
$patients = [];
while ($row = $res->fetch_assoc()) $patients[] = $row;

echo json_encode(["success"=>true,"patients"=>$patients]);

$stmt->close();
$mysqli->close();
