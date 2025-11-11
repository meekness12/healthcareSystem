<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once("../../config/db_connect.php");

$query = "
    SELECT pr.review_id, 
           p.patient_id, u.name AS patient_name,
           d.doctor_id, du.name AS doctor_name,
           pr.rating, pr.comment, pr.created_at
    FROM patient_reviews pr
    JOIN patients p ON pr.patient_id = p.patient_id
    JOIN users u ON p.user_id = u.user_id
    JOIN doctors d ON pr.doctor_id = d.doctor_id
    JOIN users du ON d.user_id = du.user_id
    ORDER BY pr.created_at DESC
";

$result = $mysqli->query($query);
$data = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode(["success" => true, "data" => $data]);
} else {
    echo json_encode(["success" => false, "message" => "No reviews found"]);
}

$conn->close();
?>
