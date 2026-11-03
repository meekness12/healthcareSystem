<?php
require_once __DIR__ . "/../../config/headers.php";
require_once __DIR__ . "/../../config/db_connect.php";

$doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 0;
if ($doctor_id <= 0) {
    echo json_encode(["success"=>false,"message"=>"Invalid doctor_id"]);
    exit;
}

$sql = "
  SELECT lt.test_id, lt.appt_id, lt.type, lt.result, lt.status, lt.report_url,
         a.datetime AS appointment_date,
         p.patient_id, u.name AS patient_name
  FROM lab_tests lt
  JOIN appointments a ON lt.appt_id = a.appt_id
  JOIN patients p ON a.patient_id = p.patient_id
  JOIN users u ON p.user_id = u.user_id
  WHERE a.doctor_id = ?
  ORDER BY lt.test_id DESC
";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success"=>false,"message"=>"Prepare failed: ".$mysqli->error]);
    exit;
}
$stmt->bind_param("i", $doctor_id);
$stmt->execute();
$res = $stmt->get_result();
$records = [];
while ($row = $res->fetch_assoc()) $records[] = $row;

echo json_encode(["success"=>true,"records"=>$records]);

$stmt->close();
$mysqli->close();
