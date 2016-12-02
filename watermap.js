function reqListener () {
      console.log(this.responseText);
}

var sourceRequest = new XMLHttpRequest(); // Source request object
var dataRequest = new XMLHttpRequest(); // Data request object
var sources = []; // List of sources
var data = []; // The current league
var previousSource = 0;
var currentSource = 0;
var currentLocation = 0;
var currentMarker;
var threshold = [];

var hoverWindow = new google.maps.InfoWindow();
var infoWindow = new google.maps.InfoWindow();

// Map
var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: new google.maps.LatLng(32.352543, -117.123172),
    mapTypeId: google.maps.MapTypeId.ROADMAP
});

// Source gets loaded
sourceRequest.onload = function() {
	// Get sources
	var foo = JSON.parse(sourceRequest.responseText);
    for(var $i = 0; $i < foo.length; $i++) {
        sources.push(foo[$i]);
    }
	
	// Load markers from the first source
	dataRequest.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var foo = JSON.parse(dataRequest.responseText);			
			for (var $i = 0; $i < foo.length; $i++){
				data.push(foo[$i]);
			}
			
			var i;
			for (i = 3; i < data.length; i++) {

                var color = calculateRating(data[i][3],data[3][0]);

				marker = new google.maps.Marker({
					position: new google.maps.LatLng(data[i][1], data[i][2]),
					map: map,
                    icon: 'http://maps.google.com/mapfiles/ms/icons/' + color[0] + '-dot.png'
				});
				
				// Add listeners to the map
				// On marker click
				google.maps.event.addListener(marker, 'click', (function(marker, i) {		
					return function() {
						currentLocation = i; currentMarker = marker;
						getData(0, true);
					}
				})(marker, i));
				
				// On marker hover start
				google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
					return function() {
						hoverWindow.setContent('<h3>' + data[i][0] + '</h3><b>Water Quality: </b><p style="color:' + calculateRating(data[i][3], data[3][0])[0] + ';"><b>' + calculateRating(data[i][3], data[3][0])[1] + '</b></p>'  );
						hoverWindow.open(map, marker);
					}
				})(marker, i));

				// On marker hover stop
				google.maps.event.addListener(marker, 'mouseout', (function(marker, i) {
					return function() {
						hoverWindow.close(map, marker);
					}
				})(marker, i));
			}					
		}
	};
	dataRequest.open("GET", "get_data.php?source=" + sources[0], true);
	dataRequest.send();
};

sourceRequest.open("GET", "get_sources.php", true);
sourceRequest.send();

function getData(i, doRefresh) {
	dataRequest.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			if(dataRequest.responseText == "0 results") {
				document.getElementById('dropdown').value = previousSource;
				currentSource = previousSource;
				window.alert("This location does not have data from the selected source!");
			} else {
				var foo = JSON.parse(dataRequest.responseText);
				data = [];
				for ( var $i = 0; $i < foo.length; $i++){
					data.push(foo[$i]);
				}
				onDataLoad(doRefresh);
			}				
		}
	};
	dataRequest.open("GET", "get_data.php?source=" + sources[i], true);
	dataRequest.send();
}

// Data gets loaded
function onDataLoad(doRefresh) {	
	// All the sub-column names
    var colNames = data[0];

    // All the main column names
    var tabNum = data[1];

    // Corresponding units to corresponding colNames EX: colNames[0] -> units[0]
    var units = data[2];

    threshold = data[3];

    // To get an array of unique tabs
    uniqueTabs = tabNum.filter(function(item, pos) {
		return tabNum.indexOf(item) == pos;
    })	
	
    // mainCategories will hold KEY: Main Tab  and VALUE: Array of Subtabs
    mainCategories = {};
    tempArray = [];
    var uniqueCount = 0;
    for ( var $i = 0; $i <= tabNum.length; $i++){
        if ( tabNum[$i] != uniqueTabs[uniqueCount] ){
            mainCategories[uniqueTabs[uniqueCount]] = tempArray;
            uniqueCount++;
            tempArray = [];
        }
        tempArray.push(colNames[$i]);
    }
	
	var contentString = '<h2 style = display:inline;>' + data[currentLocation][0] + '</h2><p style="color:' + calculateRating(data[currentLocation][3], threshold[0])[0] + '; display:inline; margin-left:10px"><b>' + calculateRating(data[currentLocation][3], threshold[0])[1] + '</b></p><br>';
	           
	// Dropdown
	contentString = contentString + '<select id = "dropdown" onchange = onDropdownChange() style = "margin-top:15px">';
	for(var j = 0; j < sources.length; j++) {
		contentString = contentString + '<option value = "' + j + '"> ' + sources[j].toUpperCase() + ' </option>';		
	}
	contentString = contentString + '</select>';
	
    // Add tabs
	contentString = contentString + '<ul class="tab" style = "list-style-type:none; margin-top:15px">';
    for(var j = 0; j < uniqueTabs.length; j++) {
        if(j == 0) {
			contentString = contentString + '<li><a href="javascript:void(0)" class="tablinks active" onclick="openTab(event, \'Tab1\')" style = "padding:8px">' + 
			uniqueTabs[0] + '</a></li>';
        } else {
            contentString = contentString + '<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab' + 
			parseInt(j + 1) + '\')" style = "padding:8px">' + uniqueTabs[j] + '</a></li>';
        }
    }
    contentString = contentString + '</ul>';

    // Add content
    for(var j = 0; j < uniqueTabs.length; j++) {
        var currentTabString = "Tab" + parseInt(j+1);       // string of the current tab, e.g. "Tab1", "Tab2"
        var tabFirstIndexString = currentTabString + '-1';  // string of the first inner tab e.g. "Tab1-1", "Tab2-1"

        // Start of tab content
        if(j == 0) {
			contentString = contentString + ' <div id="Tab1" class="tabcontent" style = "display:block">';
        } else {
            contentString = contentString + ' <div id="' + currentTabString + '" class="tabcontent">';
        }
        contentString = contentString + '<div id="content">' + '<div id="tab-container"><ul>'
                        
        // Make first inner tab active, then loop through the rest of the tabs
        contentString = contentString + '<li><a href="javascript:void(0)" class="sublinks active" onclick="openSub(event, \'' + 
			tabFirstIndexString + '\')">' + (mainCategories[uniqueTabs[j]])[0] + '</a></li>';
        for(var index = 1; index < (mainCategories[uniqueTabs[j]]).length; index++) {
            var tabLoopIndexString = "Tab" + parseInt(j + 1) + '-' + parseInt(index + 1);
            contentString = contentString + '<li><a href="javascript:void(0)" class="sublinks" onclick="openSub(event, \'' +
			tabLoopIndexString + '\')">' + (mainCategories[uniqueTabs[j]])[index] + '</a></li>';
        }

        // Start of container
        contentString = contentString + '</ul></div>' + '<div id="main-container">';

        // Make first content active, then loop through the rest of the contents
        contentString = contentString + '<div id="' + tabFirstIndexString + '" class ="subcontent" style = "display:block"> <div id = "' + tabFirstIndexString + '"></div> </div>'; 
        for(var index = 1; index < (mainCategories[uniqueTabs[j]]).length; index++) {
            var tabLoopIndexString = "Tab" + parseInt(j+1) + '-' + parseInt(index+1);
            contentString = contentString + '<div id="' + tabLoopIndexString + '\" class ="subcontent" style = "display:none"> <div id = "' + tabLoopIndexString + '"></div></div>' ;
        }

        // Closing
        contentString = contentString + '</div>' + '</div>' + '</div>' ;
    }
	
	infoWindow.setContent(contentString);
	if(doRefresh) {
 		infoWindow.open(map, currentMarker);
 		hoverWindow.close(map, currentMarker);
 	} else {
 		document.getElementById('dropdown').value = currentSource;
 	}
	
	google.charts.load('current', {'packages':['corechart']});
	
	// Set a callback to run when the Google Visualization API is loaded.
	google.charts.setOnLoadCallback(drawChart);

	// Callback that creates and populates a data table,
	// instantiates the pie chart, passes in the data and
	// draws it.
	function drawChart() {
		// Create the data table.
        var table = new google.visualization.DataTable();
		table.addColumn('string', 'Category');
		table.addColumn('number', 'Measurement');
		// Set chart options
		var options = {'width':300, 'height':200 , 'legend': 'none',
			'bar': {groupWidth: "25%"},
			'tooltip': { textStyle: { fontName: 'verdana', fontSize: 12 } },
			'hAxis' : { textStyle : {fontSize: 15 }},
			'vAxis' : { textStyle : {fontSize: 15 }}
        };

        var indexCount = 3; // Counter for table[i][x]
		var unitIndex = 0;  // Counter for units[x]
                
        // Loop through each j outer tab
		for(var j = 0; j < uniqueTabs.length; j++) {
			// Loop through k inner tabs
			for(var k = 0; k < (mainCategories[uniqueTabs[j]]).length; k++) {
				dataLoop = table.clone();
				dataLoop.addRows([
					[ (mainCategories[uniqueTabs[j]])[k] + ' (' + units[unitIndex] + ')', Number(data[currentLocation][indexCount]) ]
				]);
				var tabIndex = "Tab" + parseInt(j + 1) + "-" + parseInt(k + 1);
				var tabLoop = document.getElementById(tabIndex);
				var chartLoop = new google.visualization.ColumnChart(tabLoop);
				chartLoop.draw(dataLoop, options);

                // Increment counter at end of loop
                indexCount += 1;
                unitIndex += 1; 
            }
        }
    }
}

function onDropdownChange() {
	previousSource = currentSource;
	currentSource = document.getElementById('dropdown').value;
	getData(document.getElementById('dropdown').value, false);
}

// Return tuple of color and rating
function calculateRating(rating, threshold) {
    if(parseInt(rating) > parseInt(threshold))
        return ["red", "UNSAFE"]
    else
        return ["green", "SAFE"]
    // NOTE: parameters and conditions will change depending on client's requirements
}

// For the main tabs in the info window
function openTab(evt, cityName) {

    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

// For the subtab1 in the info window
function openSub(evt, cityName) {

    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("subcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("sublinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

/* NO LONGER NEEDED
// For the subtab2 in the info window
function openSub2(evt, cityName) {

    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("subcontent2");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("sublinks2");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}
*/
