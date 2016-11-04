<?php
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
   
    while($row = mysqli_fetch_array($columns)){
      // echo $row['Field']."<br>";
    }   

    // just selection location coordinates ATM
	$sql = "SELECT nombre_del_sitio,localizacion FROM excel GROUP BY nombre_del_sitio,localizacion";

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
       	  if ( $row['localizacion'] != ""){
       	     $row['localizacion'] = str_replace( array( '(', ')', '\'', '/', '.', ':', '"', '*', '&', '^', '%', '#', '@' ), '', $row['localizacion']);
       	     $row['localizacion'] = str_replace( '°', '.', $row['localizacion']);
       	     $words = explode(' ', $row['localizacion']);  // contains a array of 2 variables N/S coordinate and E/W coordinate
       	     array_push($words, $row['nombre_del_sitio']);  // push the beach name into the array

       	     // retrieve last character of words[0]  which will be N or S
       	     for( $i = 0; $i < strlen($words[0]); $i++ ) {
       	     	$char = substr( $words[0], $i, 1 );
       	     }

             $words[0] = str_replace($char,'', $words[0]);

             // if S then Coordinate is negative, In our case it will always be N in TJ
             if ( $char == 'S'){
             	$words[0] = '-' . $words[0] ;
             }

             // retrieve last character of words[1] which will be W or E
             for( $i = 0; $i < strlen($words[1]); $i++ ) {
       	     	$char = substr( $words[1], $i, 1 );
       	     }

       	     $words[1] = str_replace($char,'', $words[1]);
       	     // if W, then coordinate is negative, In our case, it will always be W in TJ
             if ( $char == 'W'){
             	$words[1] = '-' . $words[1] ;
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