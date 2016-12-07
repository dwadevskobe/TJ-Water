<?php
header("Content-Type: text/html;charset=utf-8");
set_include_path(get_include_path() . PATH_SEPARATOR . 'include/');
include 'PHPExcel/IOFactory.php'; // Excel parser
require_once 'config.php'; // Config

// On import button click
if(isset($_POST["import"])) {
	/** Do checks **/
	// Size. Size cannot be empty
	if($_FILES["file"]["size"] == 0) {
		printError("Please upload a valid file", true);
		exit();
	}
	// Extension. Only allow Excel files
	$extension = pathinfo($_FILES["file"]["name"], PATHINFO_EXTENSION);
	$allowedExtensions =  array('xls', 'xlsx');
	if(!in_array($extension, $allowedExtensions))
		printError("Please upload a file with the following extensions: .xls, and .xlsx", true);
	
	/** Set up connection with database and do related tasks **/
	// Create connection
	try {
		$conn = new PDO(DB_ADAPTER . ":host=" . DB_HOST, DB_USER, DB_PASSWORD);
		printDebug("Connected successfully to the database.");
	}
	catch(PDOException $e) {		
		printError("Connection failed: " . $e->getMessage, true);
	}
	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Get errors printed
	$conn->exec("SET character_set_results = 'utf8', character_set_client = 'utf8', character_set_connection = 'utf8',
				character_set_database = 'utf8', character_set_server = 'utf8'"); // Set attribute
	
	// Drop the previous exisiting database
	dropDatabase($conn, DB_NAME);	
	
	// Create database
	createDatabase($conn, DB_NAME);
	
	// Select database
	$conn->query("use " . DB_NAME);
	
	/** Parse excel **/
	$excelFile = PHPExcel_IOFactory::load($_FILES["file"]["tmp_name"]);
	$sources = $excelFile->getSheetNames();
	
	/* Sources table */
	// Write the different worksheets in the Excel file to a sources table in the database
	createTable($conn, "sources", $arr = ["source"]); // Create the table sources
	
	// Insert all the sources into the created sources table
	$query = $conn->prepare(prepareInsertQuery("sources", $arr = ["source"])); // Prepare insert query
	foreach($sources as $value) {
		$query->execute(array(strtolower($value)));
	}
	
	// For each source, create corresponding tables. Table names are appended with _[source] to reference
	// the different sources
	$sourceIndex = 0;
	foreach($sources as $currentSource) {
		$excelFile->setActiveSheetIndex($sourceIndex);
		$data = $excelFile->getActiveSheet();

		/* Parse details of excel file */
		$columns = []; // Column names
		$measures = []; // Measures
		$specialFields = []; // Special fields (those before the data)

		// Get column names and measures into respective arrays
		$highestColumm = $data->getHighestColumn();
		$highestColumm++;
		$index = 0;
		for ($column = 'A'; $column != $highestColumm; $column++) {
			$colName = $data->getCell($column . EXCEL_DATAROW)->getValue();
			
			// Continue if empty
			if(empty($colName))
				continue;

			// Add to measures array, if the column is a measure
			if($index >= EXCEL_MEASURECOLUMN - 1) 
				$measures[] = $colName; // It actually is adding stuff. Weird syntax.
			
			// If column name is duplicate, append column number at the end of the column name
			if(in_array($colName, $columns))
				$colName .= '_' . $column; 
			
			// Add to column array
			$columns[] = standarizeString($colName);

			$index++;
		}
		
		// Get special fields into respective array
		for($x = 0; $x < EXCEL_DATAROW - 1; $x++) {
			$cell = $data->getCell("A" . ($x + 1))->getValue();
			$specialFields[] = $cell;
		}

		/* Create structure table and populate with data */
		// The structure table contains the fixed columns id, name, indx, and the special fields
		$structureColumns = ["id", "name", "indx"];
		foreach($specialFields as $field) {
			$structureColumns[] = strtolower($field);
		}		
		createTable($conn, "structure_$currentSource", $structureColumns); // Create table

		// Prepare insert query
		$query = $conn->prepare(prepareInsertQuery("structure_$currentSource", $structureColumns));
		// Loop through the measures since they are our data for the structure table and build a values array
		// to insert to the table
		$index = 0;
		foreach($measures as $measure) {
			$values = [];
			$values[] = standarizeString($measure);	// id field
			$values[] = $measure;					// name field
			$values[] = $index;						// indx field
			// Now, go through the special fields to fill out the values array
			for($specialFieldRow = 1 ; $specialFieldRow < EXCEL_DATAROW; $specialFieldRow++) {
				$cell = $data->getCell(PHPExcel_Cell::stringFromColumnIndex($index + EXCEL_MEASURECOLUMN - 1) . $specialFieldRow);
				$value = $cell->getValue();
				// If value is empty, there is a chance it might be due to merged cells
				if(empty($value)) {
					// Do 
					foreach ($data->getMergeCells() as $cells) {
						if ($cell->isInRange($cells)) {
                			list($cells,) = PHPExcel_Cell::splitRange($cells);
							$value = $data->getCell($cells[0])->getValue();
							break;
						}
					}
				}
				$values[] = $value;					// special field
			}
			$query->execute($values); // Insert into table
			$index++;
		}

		/* Create the history table and populate with data */
		// The history table contains the full excel file. It's a just a cell-by-cell transcription
		createTable($conn, "history_$currentSource", $columns); // Create the table
		
		// Prepare insert query
		$query = $conn->prepare(prepareInsertQuery("history_$currentSource", $columns));
		// Loop through the rows until the end of data to build the values array to insert to the table
		$highestRow = $data->getHighestRow();
		for ($row = EXCEL_DATAROW + 1; $row <= $highestRow; $row++) {
			$containsData = false; // We will use this variable to ignore empty rows
			$values = [];
			// Loop through the columns to actually get the data
			for ($column = 'A'; $column != $highestColumm; $column++) {
				// Break if all the columns have been processed
				if(PHPExcel_Cell::columnIndexFromString($column) > count($columns)) 
					break;

				$cell = $data->getCell($column . $row)->getCalculatedValue();
				
				// If cell is empty, add empty value to array,
				// else, add cell to array
				if(empty($cell)) {
					$values[] = "";
				} else {
					$containsData = true;

					// If it's the first column (date), change the date into MySQL format
					if($column == 'A') {
						$cell = $data->getCell($column . $row);
						// Get whether the cell is formatted by Excel and get the date accordingly
						if (PHPExcel_Shared_Date::isDateTime($cell)) 
							$date = $cell->getFormattedValue();
						else
							$date = $cell->getValue();

						// Replace weird characters seen in the Excel file					
						$date = str_replace('"', '', $date);
						$date = str_replace('-', '/', $date);
						
						// Change to MySQL format
						if(strlen(explode("/", $date)[2]) == 2)
							$cell = Datetime::createFromFormat('d/m/y', $date)->format('Y-m-d');
						else
							$cell = Datetime::createFromFormat('d/m/Y', $date)->format('Y-m-d');				
					}

					$values[] = $cell;
				}			
			}
			// Insert into table only if it contains data
			if($containsData){
				$query->execute($values);
			}
		}
		
		/* Create the data table and populate it with data */
		// The data table contains the latest data contained in the excel file
		// This will be the table that is used by the map to request the latest updates on the locations
		$query = "CREATE TABLE data_$currentSource AS SELECT * FROM history_$currentSource WHERE fecha = (SELECT MAX(fecha) FROM history_$currentSource)";

		// Run query
		try {
			$conn->exec("$query");
			printDebug("Successfully created table 'data_$currentSource'");
		}
		catch(PDOException $e) {
			printError("Error creating table '$string': " . $e->getMessage(), false);
			printError($query, true);
		}

		// Increment source index for next run
		$sourceIndex++;
    }
	
	echo "The script has finished running";
	echo "<br/>";

	// Close connection
	$conn = null;
}

/*
	Function that creates a table 

	Parameters
	$conn - ? - the connection to the database
	$name - String - the name of the table
	$columns - String[] - an array containing the column names
*/
function createTable($conn, $name, $columns) {
	$query = "CREATE TABLE $name (";
	// Fill up query with the column name array
	foreach($columns as $val) {
		// Check if column name is a date
		if(strpos($val, 'fecha') !== false)
			$query .= "$val DATE, "; 
		else
			$query .= "$val TEXT, ";
	}
	$query = substr($query, 0, -2) . ")"; // Remove last lingering comma and finish statement

	// Run query
	try {
		$conn->exec("$query");
		printDebug("Successfully created table '" . $name ."'");
	}
	catch(PDOException $e) {
		printError("Error creating table '$name': " . $e->getMessage(), false);
		printError($query, true);
	}
}

/*
	Function that returns a query for a PHP prepared statement 
	More info at http://www.w3schools.com/PHP/php_mysql_prepared_statements.asp

	Parameters
	$tableName - String - the table name of the prepared statement
	$array - String[] - the name of the columns

	Return value
	A string with format: "INSERT INTO $tableName ($array...) VALUES (:$array...)" 
*/
function prepareInsertQuery($tableName, $array) {
	$statement = "INSERT INTO " . $tableName . " (";
	// Fill up query with the column name array
	foreach($array as $val) {
		$statement .= "$val, ";
	}
	$statement = substr($statement, 0, -2) . ")"; // Remove last lingering comma and end segment
	$statement .= " VALUES (";
	// Fill values with :name
	foreach($array as $val) {
		$statement .=  "?, ";
	}
	$statement = substr($statement, 0, -2) . ")"; // Remove last lingering comma and finish statement
	return $statement;
}

/*
	Function that creates a database 

	Parameters
	$conn - ? - the connection to the database
	$db - String - the name of the database to create
*/
function createDatabase($conn, $db) {
	$query = "CREATE DATABASE $db";
	try {
		$conn->exec($query);
		printDebug("The database $db has been created successfully");
	}
	catch(PDOException $e) {
		printError("Error creating database: " . $e->getMessage(), false);
		printError($query, true);
	}
}

/*
	Function that drops a database 

	Parameters
	$conn - ? - the connection to the database
	$db - String - the name of the database to drop
*/
function dropDatabase($conn, $db) {
	$query = "DROP DATABASE $db";
	try {
		$conn->exec($query);
		printDebug("The database $db has been dropped successfully");
	}
	catch(PDOException $e) {
		printDebug("The database $db does not exist");
	}
}

/*
	Function that standarizes a string to conform to MySQL's requirements for a column name in a table

	Parameters
	$string - String - the regular string

	Return value
	A string with the formatted input, readable by MySQL
*/
function standarizeString($string) {
	$string = trim($string);
	$string = str_replace( array( '(', ')', '\'', '/', '.', ':', '%', '*', '&', '^', '%', '#', '@', '°' ), '', $string);
	$string = str_replace( ' ', '_', $string);
	$string = remove_accents($string); // Remove accents
	$string = strtolower($string);
	return $string;
}

/*
	Function that writes a debug text to the admin-panel 

	Parameters
	$string - String - the text to write
*/
function printDebug($string) {
	if(DEBUG == true) {
		echo $string;
		echo "<br/>";
	}
}

/*
	Function that writes an error text to the admin-panel 

	Parameters
	$string - String - the text to write
	$terminate - Boolean - determines whether to terminate the process on printing
*/
function printError($string, $terminate) {
	echo "There was an error while parsing the Excel file!";
	echo "Please consult the <a href="https://docs.google.com/document/d/17dOb2efxTtzNrjni9kba32Qm1824V_EylqvzHwcNJOk/">manual</a> for troubleshooting.";
	echo "<br/>";
	echo "ERROR:";
	echo "<br/>";
	echo $string;
	echo "<br/>";
	if($terminate === TRUE)
		exit;
}

/*
	Function that replaces every character with an accent to their respective non accented character 

	Parameters
	$string - String - the string to replace

	Return value
	A string with all the accents replaced by their counterpart
*/
function remove_accents($string) {
    if ( !preg_match('/[\x80-\xff]/', $string) )
        return $string;

    $chars = array(
    // Decompositions for Latin-1 Supplement
    chr(195).chr(128) => 'A', chr(195).chr(129) => 'A',
    chr(195).chr(130) => 'A', chr(195).chr(131) => 'A',
    chr(195).chr(132) => 'A', chr(195).chr(133) => 'A',
    chr(195).chr(135) => 'C', chr(195).chr(136) => 'E',
    chr(195).chr(137) => 'E', chr(195).chr(138) => 'E',
    chr(195).chr(139) => 'E', chr(195).chr(140) => 'I',
    chr(195).chr(141) => 'I', chr(195).chr(142) => 'I',
    chr(195).chr(143) => 'I', chr(195).chr(145) => 'N',
    chr(195).chr(146) => 'O', chr(195).chr(147) => 'O',
    chr(195).chr(148) => 'O', chr(195).chr(149) => 'O',
    chr(195).chr(150) => 'O', chr(195).chr(153) => 'U',
    chr(195).chr(154) => 'U', chr(195).chr(155) => 'U',
    chr(195).chr(156) => 'U', chr(195).chr(157) => 'Y',
    chr(195).chr(159) => 's', chr(195).chr(160) => 'a',
    chr(195).chr(161) => 'a', chr(195).chr(162) => 'a',
    chr(195).chr(163) => 'a', chr(195).chr(164) => 'a',
    chr(195).chr(165) => 'a', chr(195).chr(167) => 'c',
    chr(195).chr(168) => 'e', chr(195).chr(169) => 'e',
    chr(195).chr(170) => 'e', chr(195).chr(171) => 'e',
    chr(195).chr(172) => 'i', chr(195).chr(173) => 'i',
    chr(195).chr(174) => 'i', chr(195).chr(175) => 'i',
    chr(195).chr(177) => 'n', chr(195).chr(178) => 'o',
    chr(195).chr(179) => 'o', chr(195).chr(180) => 'o',
    chr(195).chr(181) => 'o', chr(195).chr(182) => 'o',
    chr(195).chr(182) => 'o', chr(195).chr(185) => 'u',
    chr(195).chr(186) => 'u', chr(195).chr(187) => 'u',
    chr(195).chr(188) => 'u', chr(195).chr(189) => 'y',
    chr(195).chr(191) => 'y',
    // Decompositions for Latin Extended-A
    chr(196).chr(128) => 'A', chr(196).chr(129) => 'a',
    chr(196).chr(130) => 'A', chr(196).chr(131) => 'a',
    chr(196).chr(132) => 'A', chr(196).chr(133) => 'a',
    chr(196).chr(134) => 'C', chr(196).chr(135) => 'c',
    chr(196).chr(136) => 'C', chr(196).chr(137) => 'c',
    chr(196).chr(138) => 'C', chr(196).chr(139) => 'c',
    chr(196).chr(140) => 'C', chr(196).chr(141) => 'c',
    chr(196).chr(142) => 'D', chr(196).chr(143) => 'd',
    chr(196).chr(144) => 'D', chr(196).chr(145) => 'd',
    chr(196).chr(146) => 'E', chr(196).chr(147) => 'e',
    chr(196).chr(148) => 'E', chr(196).chr(149) => 'e',
    chr(196).chr(150) => 'E', chr(196).chr(151) => 'e',
    chr(196).chr(152) => 'E', chr(196).chr(153) => 'e',
    chr(196).chr(154) => 'E', chr(196).chr(155) => 'e',
    chr(196).chr(156) => 'G', chr(196).chr(157) => 'g',
    chr(196).chr(158) => 'G', chr(196).chr(159) => 'g',
    chr(196).chr(160) => 'G', chr(196).chr(161) => 'g',
    chr(196).chr(162) => 'G', chr(196).chr(163) => 'g',
    chr(196).chr(164) => 'H', chr(196).chr(165) => 'h',
    chr(196).chr(166) => 'H', chr(196).chr(167) => 'h',
    chr(196).chr(168) => 'I', chr(196).chr(169) => 'i',
    chr(196).chr(170) => 'I', chr(196).chr(171) => 'i',
    chr(196).chr(172) => 'I', chr(196).chr(173) => 'i',
    chr(196).chr(174) => 'I', chr(196).chr(175) => 'i',
    chr(196).chr(176) => 'I', chr(196).chr(177) => 'i',
    chr(196).chr(178) => 'IJ',chr(196).chr(179) => 'ij',
    chr(196).chr(180) => 'J', chr(196).chr(181) => 'j',
    chr(196).chr(182) => 'K', chr(196).chr(183) => 'k',
    chr(196).chr(184) => 'k', chr(196).chr(185) => 'L',
    chr(196).chr(186) => 'l', chr(196).chr(187) => 'L',
    chr(196).chr(188) => 'l', chr(196).chr(189) => 'L',
    chr(196).chr(190) => 'l', chr(196).chr(191) => 'L',
    chr(197).chr(128) => 'l', chr(197).chr(129) => 'L',
    chr(197).chr(130) => 'l', chr(197).chr(131) => 'N',
    chr(197).chr(132) => 'n', chr(197).chr(133) => 'N',
    chr(197).chr(134) => 'n', chr(197).chr(135) => 'N',
    chr(197).chr(136) => 'n', chr(197).chr(137) => 'N',
    chr(197).chr(138) => 'n', chr(197).chr(139) => 'N',
    chr(197).chr(140) => 'O', chr(197).chr(141) => 'o',
    chr(197).chr(142) => 'O', chr(197).chr(143) => 'o',
    chr(197).chr(144) => 'O', chr(197).chr(145) => 'o',
    chr(197).chr(146) => 'OE',chr(197).chr(147) => 'oe',
    chr(197).chr(148) => 'R',chr(197).chr(149) => 'r',
    chr(197).chr(150) => 'R',chr(197).chr(151) => 'r',
    chr(197).chr(152) => 'R',chr(197).chr(153) => 'r',
    chr(197).chr(154) => 'S',chr(197).chr(155) => 's',
    chr(197).chr(156) => 'S',chr(197).chr(157) => 's',
    chr(197).chr(158) => 'S',chr(197).chr(159) => 's',
    chr(197).chr(160) => 'S', chr(197).chr(161) => 's',
    chr(197).chr(162) => 'T', chr(197).chr(163) => 't',
    chr(197).chr(164) => 'T', chr(197).chr(165) => 't',
    chr(197).chr(166) => 'T', chr(197).chr(167) => 't',
    chr(197).chr(168) => 'U', chr(197).chr(169) => 'u',
    chr(197).chr(170) => 'U', chr(197).chr(171) => 'u',
    chr(197).chr(172) => 'U', chr(197).chr(173) => 'u',
    chr(197).chr(174) => 'U', chr(197).chr(175) => 'u',
    chr(197).chr(176) => 'U', chr(197).chr(177) => 'u',
    chr(197).chr(178) => 'U', chr(197).chr(179) => 'u',
    chr(197).chr(180) => 'W', chr(197).chr(181) => 'w',
    chr(197).chr(182) => 'Y', chr(197).chr(183) => 'y',
    chr(197).chr(184) => 'Y', chr(197).chr(185) => 'Z',
    chr(197).chr(186) => 'z', chr(197).chr(187) => 'Z',
    chr(197).chr(188) => 'z', chr(197).chr(189) => 'Z',
    chr(197).chr(190) => 'z', chr(197).chr(191) => 's'
    );

    $string = strtr($string, $chars);

    return $string;
}
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<!--<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />-->
		<title>PFEA Water Quality Map Admin</title>
		<style>
			
			table {
				font-family: "Lucida Sans Unicode", "Lucida Grande", Sans-Serif;
				font-size: 12px;
				margin-top: 45px;
				width: 480px;
				text-align: left;
				border-collapse: collapse;
				border: 1px solid #5a5c51;
			}
			th {
				padding: 15px 10px 10px 10px;
				font-weight: normal;
				font-size: 14px;
				color: #039;
			}
			tbody {
				background: #e8edff;
			}
			td {
				padding: 10px;
				color: #039;
				border-top: 1px dashed #5a5c51;
				border-right: 1px dashed #5a5c51;
			}
			td.special {
				background: #d0dafd;
				padding: 10px;
				color: #039;
				border-top: 1px dashed #5a5c51;
				border-right: 1px dashed #5a5c51;
			}
			a {				
				color: #5a5c51;
			}
		</style>
	</head>
	<body>
		<form enctype="multipart/form-data" method="post">
			<table border="1" width="40%" align="center">			
    			<thead>
					<tr>
						<th colspan="2" align="center"><strong>PFEA Water Quality Map - Admin Panel</strong></th>
					</tr>
   				</thead>
				<tbody>
					<tr>
						<td class="special" colspan="2" align="left"><strong>Update Map - Import an Excel file</strong></td>
					</tr>
					<tr>
						<td align="center">Excel file (.xls, .xlsx)</td>
						<td><input type="file" name="file" id="file"></td>
					</tr>
					<tr>
						<td colspan="2" align="center"><input type="submit" name="import" value="Import"></td>
					</tr>
					
					<tr>
						<td class="special" colspan="2" align="left"><strong>Documentation</strong></td>
					</tr>
					<tr>
						<td align="center">Client</td>
						<td align="center"><a href="https://docs.google.com/document/d/17dOb2efxTtzNrjni9kba32Qm1824V_EylqvzHwcNJOk">Link</a></td>
					</tr>
					<tr>
						<td align="center">Developer</td>
						<td align="center"><a href="https://docs.google.com/document/d/1hgKUZW499j5S0wNf6Xmc9PZsuT8jIiHJYwgbUPLjgFA">Link</a></td>
					</tr>
				</tbody>				
			</table>
		</form>
	</body>
</html>