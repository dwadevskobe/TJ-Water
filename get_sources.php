<?php
	// THIS FILE GETS DATA FROM THE DATABASE AND TALKS TO WATERMAP.JS
	set_include_path(get_include_path() . PATH_SEPARATOR . 'include/');
	require_once 'config.php';
	
	// Create connection
	try {
		$conn = new PDO(DB_ADAPTER . ":host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASSWORD);
	}
	catch(PDOException $e) {		
		echo "Connection failed: " . $e->getMessage;
        exit;
	}
	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Get errors printed
	$conn->exec("SET character_set_results = 'utf8', character_set_client = 'utf8', character_set_connection = 'utf8',
				character_set_database = 'utf8', character_set_server = 'utf8'"); // Set attribute
	
    // Gets sources
    $sources = array();
	try {
		$query = $conn->query("SELECT source from sources");
		while($row = $query->fetch(PDO::FETCH_ASSOC)) {
		   array_push($sources, $row["source"]);
		}
	}
	catch(PDOException $e) {
		echo "There was a problem retrieving the sources " . $e->getMessage();
	}

    echo json_encode($sources);
    $conn = null;
?>
