<?php
class AppointmentModel {
    private $mysqli;

    public function __construct($mysqli) {
        $this->mysqli = $mysqli;
    }

    // Fetch appointments for a patient
    public function getAppointmentsByPatient($patient_id) {
        $stmt = $this->mysqli->prepare("
            SELECT a.appt_id, u.name AS doctor, d.department, a.datetime, a.status
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.doctor_id
            JOIN users u ON d.user_id = u.user_id
            WHERE a.patient_id = ?
            ORDER BY a.datetime DESC
        ");
        $stmt->bind_param("i", $patient_id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    // Add a new appointment
    public function addAppointment($patient_id, $doctor_id, $datetime, $is_emergency = 0) {
        $stmt = $this->mysqli->prepare("
            INSERT INTO appointments (patient_id, doctor_id, datetime, status, is_emergency)
            VALUES (?, ?, ?, 'scheduled', ?)
        ");
        $stmt->bind_param("iisi", $patient_id, $doctor_id, $datetime, $is_emergency);
        return $stmt->execute();
    }
}
