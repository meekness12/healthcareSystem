<?php
header("Content-Type: application/json");
include("../../config/db_connect.php");

$data = json_decode(file_get_contents("php://input"), true);

$appt_id = intval($data['appt_id']);
$status = $data['status'];

if (!in_array($status, ['accepted','rejected'])) {
    echo json_encode(["success"=>false,"message"=>"Invalid status"]);
    exit;
}

$stmt = $mysqli->prepare("UPDATE appointments SET status=? WHERE appt_id=?");
$stmt->bind_param("si", $status, $appt_id);
if ($stmt->execute()) {
    echo json_encode(["success"=>true,"message"=>"Status updated"]);
} else {
    echo json_encode(["success"=>false,"message"=>$stmt->error]);
}
$stmt->close();
$mysqli->close();
?>
