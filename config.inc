<?php
    define('DB_USER','root');
    define('DB_PASSWORD','');
    define('DB_HOST','localhost');
    define('DB_NAME','map');
	$conn = mysqli_connect(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
	mysqli_set_charset($conn, "utf8");
    
    if (!$conn) {
      die("Connection failed: " . mysqli_connect_error());
    }
?>

