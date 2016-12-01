function reqListener () {
      console.log(this.responseText);
}

var oReq = new XMLHttpRequest(); //New request object

// WHERE ALL THE JAVASCRIPT GETS PUT INTO
oReq.onload = function() {
	var locations = [];

    var foo = JSON.parse(oReq.responseText);
    for ( var $i = 0; $i < foo.length; $i++){
        locations.push(foo[$i]);
    }

    // all the sub-column names
    var colNames = foo[0];

    // all the main column names
    var tabNum = foo[1];

    // corresponding units to corresponding colNames EX: colNames[0] -> units[0]
    var units = foo[2];

    // to get an array of unique tabs
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

    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11,
        center: new google.maps.LatLng(32.352543, -117.123172),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow1 = new google.maps.InfoWindow();
    var infowindow2 = new google.maps.InfoWindow();

    var marker, i;

    // Go through all the beach locations
    for (i = 3; i < locations.length; i++) {
        marker = new google.maps.Marker({
			position: new google.maps.LatLng(locations[i][1], locations[i][2]),
			map: map
        });

        // When you hover over a marker
        google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
			return function() {
				infowindow1.setContent('<h3>' + locations[i][0] + '</h3><b>Water Quality: </b><p style="color:' + calculateRating(35)[0] + ';"><b>' + calculateRating(35)[1] + '</b></p>'  );
				infowindow1.open(map, marker);
			}
        })(marker, i));

        // When you stop hovering over marker
        google.maps.event.addListener(marker, 'mouseout', (function(marker, i) {
			return function() {
				infowindow1.close(map, marker);
			}
        })(marker, i));
			
        // When you click on a marker, It shows all the tabs
        google.maps.event.addListener(marker, 'click', (function(marker, i) {		
			return function() {
                var contentString = '<h2 style = display:inline;>' + locations[i][0] + '</h2><p style="color:' + calculateRating(34)[0] + '; display:inline; margin-left:10px"><b>' + calculateRating(34)[1] + '</b></p><br>' +
                    '<select style = "margin-top:15px">' + 
                       '<option value = "pfea"> PFEA </option>' +
                       '<option value = "cespt"> CESPT </option>' +
                       '<option value = "cofepris"> COFEPRIS </option>' +
                    '</select>' +

                    '<ul class="tab" style = "list-style-type:none; margin-top:15px">';

                    // SOFTCODED VERSION OF THE TABS
                    for(var j = 0; j < uniqueTabs.length; j++)
                    {
                        if(j == 0) {
                          contentString = contentString + '<li><a href="javascript:void(0)" class="tablinks active" onclick="openTab(event, \'Tab1\')" style = "padding:8px">'+ uniqueTabs[0] + '</a></li>';
                        } else {
                          contentString = contentString + '<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab'+parseInt(j+1)+'\')" style = "padding:8px">' + uniqueTabs[j] + '</a></li>';
                        }
                    }

                    contentString = contentString + '</ul>';

                    // SOFTCODED VERSION OF CONTENTS
                    for(var j = 0; j < uniqueTabs.length; j++)
                    {
                        var currentTabString = "Tab" + parseInt(j+1);       // string of the current tab, e.g. "Tab1", "Tab2"
                        var tabFirstIndexString = currentTabString + '-1';  // string of the first inner tab e.g. "Tab1-1", "Tab2-1"

                        // Start of tab content
                        if(j == 0) {
                            contentString = contentString + ' <div id="Tab1" class="tabcontent" style = "display:block">';
                        } else {
                            contentString = contentString + ' <div id="' + currentTabString + '" class="tabcontent">';
                        }
                        contentString = contentString + 
                               '<div id="content">' + 
                                   '<div id="tab-container"><ul>'
                        
                        // Make first inner tab active, then loop through the rest of the tabs
                        contentString = contentString + '<li><a href="javascript:void(0)" class="sublinks active" onclick="openSub(event, \''+tabFirstIndexString+'\')">' + (mainCategories[uniqueTabs[j]])[0]  +'</a></li>';
                        for(var index = 1; index < (mainCategories[uniqueTabs[j]]).length; index++)
                        {
                            var tabLoopIndexString = "Tab" + parseInt(j+1) + '-' + parseInt(index+1);
                            contentString = contentString + '<li><a href="javascript:void(0)" class="sublinks" onclick="openSub(event, \''+tabLoopIndexString + '\')">' + (mainCategories[uniqueTabs[j]])[index]  +'</a></li>';
                        }

                        // Start of container
                        contentString = contentString + 
                             '</ul></div>' + 
                                   '<div id="main-container">';

                        // Make first content active, then loop through the rest of the contents
                        contentString = contentString + '<div id="'+tabFirstIndexString+'" class ="subcontent" style = "display:block"> <div id = "'+tabFirstIndexString+'"></div> </div>'; 
                        for(var index = 1; index < (mainCategories[uniqueTabs[j]]).length; index++)
                        {
                            var tabLoopIndexString = "Tab" + parseInt(j+1) + '-' + parseInt(index+1);
                            contentString = contentString 
                                          + '<div id="'+ tabLoopIndexString + '\" class ="subcontent" style = "display:none"> <div id = "'+ tabLoopIndexString +'"></div>  </div>' ;
                        }

                        // Closing
                        contentString = contentString + 
                                   '</div>' + 
                                '</div>' + 
                            '</div>' ;
                    }

				infowindow2.setContent(contentString);
				infowindow2.open(map, marker);
				infowindow1.close(map, marker);
			       
			    google.charts.load('current', {'packages':['corechart']});

		      // Set a callback to run when the Google Visualization API is loaded.
		      google.charts.setOnLoadCallback(drawChart);

		      // Callback that creates and populates a data table,
		      // instantiates the pie chart, passes in the data and
		      // draws it.
		      function drawChart() {

		        // Create the data table.
		        var data = new google.visualization.DataTable();
		        data.addColumn('string', 'Category');
		        data.addColumn('number', 'Measurement');
                // Set chart options
                var options = {'width':300, 'height':200 , 'legend': 'none',
                           'bar': {groupWidth: "25%"},
                           'tooltip': { textStyle: { fontName: 'verdana', fontSize: 12 } },
                           'hAxis' : { textStyle : {fontSize: 15 } },
                           'vAxis' : { textStyle : {fontSize: 15 }}
                };

                var indexCount = 3; // counter for locations[i][x]
                var unitIndex = 0;  // counter for units[x]
                
                // Loop through each j outer tab
                for(var j = 0; j<uniqueTabs.length; j++)
                {
                    // Loop through k inner tabs
                    for(var k = 0; k < (mainCategories[uniqueTabs[j]]).length; k++)
                    {
                        dataLoop = data.clone();
                        dataLoop.addRows([
                            [ (mainCategories[uniqueTabs[j]])[k] + ' (' + units[unitIndex] + ')', Number(locations[i][indexCount]) ]
                        ]);
                        var TabIndex = "Tab" + parseInt(j+1) + "-" + parseInt(k+1);
                        var TabLoop = document.getElementById(TabIndex);
                        var chartLoop = new google.visualization.ColumnChart(TabLoop);
                        chartLoop.draw(dataLoop, options);

                        // Increment counter at end of loop
                        indexCount += 1;
                        unitIndex += 1;      
                    }
                }
		      }

			}
		})(marker, i));
	}
};

oReq.open("GET", "get_data.php", true);
//                               ^ Don't block the rest of the execution.
//                                 Don't wait until the request finishes to 
//                                 continue.

oReq.send();

// Return tuple of color and rating
function calculateRating(rating) {
    if(rating < 50)
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
