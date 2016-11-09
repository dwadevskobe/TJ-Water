<?php

// THIS FILE GETS DATA FROM THE DATABASE AND TALKS TO WATERMAP.JS

set_include_path(get_include_path() . PATH_SEPARATOR . 'helpers/');
include 'PHPExcel/IOFactory.php';

	$host = "localhost";
	$username = "root";
	$password = "";
	$db = 'map';

	/* Set up connection with database and do related tasks */
	// Create connection
	$conn = new mysqli($host, $username, $password, $db);
	mysqli_set_charset($conn, "utf8");
	
	// Check connection
	if ($conn->connect_error) {
		die("Connection failed: " . $conn->connect_error);
	} 

    // gets all column names 
    $columnNames = "SHOW COLUMNS FROM excel";
    $columns = $conn -> query($columnNames);

    if(!$columnNames)
    {
        echo 'Something wrong with query: ' . mysqli_error($conn);
    }

    $colNames = array();
   
    while($row = mysqli_fetch_array($columns)){
       array_push($colNames,$row['Field']);
    }   


    // just selection location coordinates ATM
	$sql = "SELECT * FROM excel WHERE $colNames[0] = (SELECT MAX($colNames[0]) FROM excel)";

	$result = $conn->query($sql);

    // debugging purposes
	if(!$result)
    {
        echo 'Something wrong with query: ' . mysqli_error($conn);
    }

    $locations = array();


    // This whole result chunk is only for location coordinates and beach name ATM 
	if ($result->num_rows > 0) {
       // output data of each row
       while($row = $result->fetch_assoc()) {
       	  if ( $row[$colNames[2]] != ""){
       	     $row[$colNames[2]] = str_replace( array( '(', ')', '\'', '/', '.', ':', '"', '*', '&', '^', '%', '#', '@' ), '', $row[$colNames[2]]);
       	     $row[$colNames[2]] = str_replace( '°', '.', $row[$colNames[2]]);
             $words = array();
             array_push($words, $row[$colNames[1]]);  // push the beach name into the array  (index 0 in words)
       	     $word = explode(' ', $row[$colNames[2]]);  // contains a array of 2 variables N/S coordinate and E/W coordinate ( index 1 and 2 in words)
             $words = array_merge($words,$word);
             array_push($words, $row[$colNames[3]]);  // (index 3 in words)

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
             array_push($locations,$words);
          }
       }

       // to be retrieved in other file 
       // CURRENTLY:  locations[0] : latitude  , locations[1] : longitude, locations[2]: beach name
       echo json_encode($locations);
    } 
    else {
       echo "0 results";
    }

    $conn->close();

?>