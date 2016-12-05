<?php
	// THIS FILE GETS DATA FROM THE DATABASE AND TALKS TO WATERMAP.JS
	set_include_path(get_include_path() . PATH_SEPARATOR . 'include/');
	require_once 'config.php';

	$source = $_GET['source'];
	
	// Create connection
	try {
		$conn = new PDO(DB_ADAPTER . ":host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASSWORD);
	}
	catch(PDOException $e) {		
		echo "Connection failed: " . $e->getMessage;
		echo "<br/>";
		exit;
	}
	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Get errors printed
	$conn->exec("SET character_set_results = 'utf8', character_set_client = 'utf8', character_set_connection = 'utf8',
				character_set_database = 'utf8', character_set_server = 'utf8'"); // Set attribute
	
    // Gets all column names
    $colNames = array();  
	try {
		foreach($conn->query("SHOW COLUMNS FROM data_$source") as $row) {
			array_push($colNames, $row['Field']);
		}
	}
	catch(PDOException $e) {
		echo "There was a problem retrieving the column names " . $e->getMessage();
		echo "<br/>";
		exit;
	}

	// Array with all the data to be used for later
	$data = array();

	// Get the name, tab, and units info from the structure table
	$name = array();
	$tab = array();
	$units = array();
	$threshold = array();
	try {
		foreach($conn->query("SELECT * FROM structure_$source") as $row) {
		   array_push($name, $row["name"]);		// first array in array locations is colNames
		   array_push($tab, $row["tabs"]);		// second array in array locations is colNames
		   array_push($units, $row["units"]);	// third array in array locations is colNames
		   array_push($threshold, $row["threshold"]);	// third array in array locations is colNames
		}
		
		// Push into the data variable, which will go to the js file
		array_push($data, $name);	// first array in array locations is colNames
		array_push($data, $tab);	// second array in array locations is colNames
		array_push($data, $units);	// third array in array locations is colNames
		array_push($data, $threshold); 
	}
	catch(PDOException $e) {
		echo "There was a problem parsing the structure table " . $e->getMessage();
		echo "<br/>";
		exit;
	}	
	
    $result = $conn->query("SELECT * FROM data_$source ORDER BY sitio");

    // This whole result chunk is only for location coordinates and beach name ATM 
	if ($result->rowCount() > 0) {
       // output data of each row
       while($row = $result->fetch(PDO::FETCH_ASSOC)) {
       	  if ( $row[$colNames[2]] != ""){
       	     $row[$colNames[2]] = str_replace( array( '(', ')', '\'', '/', '.', ':', '"', '*', '&', '^', '%', '#', '@' ), '', $row[$colNames[2]]);
       	     $row[$colNames[2]] = str_replace( '°', '.', $row[$colNames[2]]);
             $words = array();
             array_push($words, $row[$colNames[1]]);  // push the beach name into the array  (index 0 in words)
       	     $word = explode(' ', $row[$colNames[2]]);  // contains a array of 2 variables N/S coordinate and E/W coordinate ( index 1 and 2 in words)
             $words = array_merge($words,$word);


             // Push the rest of columns in words starting from index 3
             for ($i = 3; $i < sizeof($colNames); $i++){
                array_push($words, $row[$colNames[$i]]); 
             }

       	     // retrieve last character of words[0]  which will be N or S
       	     for( $i = 0; $i < strlen($words[1]); $i++ ) {
       	     	$char = substr( $words[1], $i, 1 );
       	     }

             $words[1] = str_replace($char,'', $words[1]);

             // if S then Coordinate is negative, In our case it will always be N in TJ
             if ( $char == 'S'){
             	$words[1] = '-' . $words[1] ;
             }

             // retrieve last character of words[1] which will be W or E
             for( $i = 0; $i < strlen($words[2]); $i++ ) {
       	     	$char = substr( $words[2], $i, 1 );
       	     }

       	     $words[2] = str_replace($char,'', $words[2]);
       	     // if W, then coordinate is negative, In our case, it will always be W in TJ
             if ( $char == 'W'){
             	$words[2] = '-' . $words[2] ;
             }
            
             // an array of arrays
             array_push($data,$words);
          }
       }

       // to be retrieved in other file 
       // CURRENTLY:  data[0] : name, data[1] : latitude, data[2]: longitude
       echo json_encode($data);
    } 
    else {
       echo "0 results";
    }

    $conn = null;
?>
