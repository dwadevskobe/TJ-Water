<?php
/* Database */
define('DB_USER','root');
define('DB_PASSWORD','');
define('DB_HOST','localhost');
define('DB_NAME','map');

// Our connection to the database use PDO (PHP Data Object).
// More info at http://php.net/manual/en/intro.pdo.php
// PDO supports a number of different databases;
// See the supported databases and installation guide for their drivers
// at http://php.net/manual/en/pdo.drivers.php
define('DB_ADAPTER','mysql');

/* Variables for Excel */
define('EXCEL_DATAROW',4);         // The row number where the data starts
define('EXCEL_MEASURECOLUMN',4);   // The column number where the measures start

/* Other */
define('DEBUG',false);             // Print debug statements?
?>