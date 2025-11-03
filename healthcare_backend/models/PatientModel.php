<?php
// models/PatientModel.php
class PatientModel {
    private $mysqli;

    public function __construct($mysqli) {
        $this->mysqli = $mysqli;
    }

    // Fetch medical records for a specific patient
    public function getMedicalRecords($patient_id) {
        $stmt = $this->mysqli->prepare("
            SELECT record_id AS id, type, doctor_name AS doctor, record_date AS date, notes
            FROM medical_records
            WHERE patient_id = ?
            ORDER BY record_date DESC
        ");
        $stmt->bind_param("i", $patient_id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
