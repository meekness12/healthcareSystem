<?php
// =============================================
// db_connect.php - MySQLi Database Connection
// =============================================

// ---------------------------
// Database Credentials
// ---------------------------
define('DB_HOST', 'localhost');          // Database host
define('DB_USER', 'root');               // Database username
define('DB_PASS', '');                   // Database password
define('DB_NAME', 'healthcare_system');  // Database name

// Optional debug mode
define('DEBUG', true);

// ---------------------------
// Create MySQLi Connection
// ---------------------------
$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// ---------------------------
// Check Connection
// ---------------------------
if ($mysqli->connect_errno) {
    if (DEBUG) {
        die("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error);
    } else {
        die("Database connection error. Please try again later.");
    }
}

// ---------------------------
// Set UTF-8 encoding
// ---------------------------
$mysqli->set_charset("utf8");

// ---------------------------
// Optional debugging function
// ---------------------------
function debug($data) {
    if (DEBUG) {
        echo '<pre>';
        print_r($data);
        echo '</pre>';
    }
}
?>
