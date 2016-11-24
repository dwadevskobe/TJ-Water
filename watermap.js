function reqListener () {
      console.log(this.responseText);
}

var oReq = new XMLHttpRequest(); //New request object

// WHERE ALL THE JAVASCRIPT GETS PUT INTO
oReq.onload = function() {
	var locations = []
	
    // This is where you handle what to do with the response.
    // The actual data is found on this.responseText
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
				infowindow1.setContent('<h3>' + locations[i][0] + '</h3><b>Water Level: </b><p style="color:green;"><b>SAFE</b></p>'  );
				infowindow1.open(map, marker);
			}
        })(marker, i));

        // When you stop hovering over marker
        google.maps.event.addListener(marker, 'mouseout', (function(marker, i) {
			return function() {
				infowindow1.close(map, marker);
			}
        })(marker, i));
			
        // When you click on a marker
        google.maps.event.addListener(marker, 'click', (function(marker, i) {		
			return function() {
				infowindow2.setContent(locations[i][0] + '<p style="color:green;"><b>SAFE</b></p>' +
					'<ul class="tab" style = "list-style-type: none">' + 
                       '<li><a href="javascript:void(0)" class="tablinks active" onclick="openTab(event, \'Tab1\')" style = "font-size:95%">'+ uniqueTabs[0] + '</a></li>' +
					   '<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab2\')" style = "font-size:95%">' + uniqueTabs[1] + '</a></li>' +
                    '</ul>' +  
					' <div id="Tab1" class="tabcontent" style = "display:block">' +
                        '<div id="content">' + 
                           '<div id="tab-container"><ul>' +
                              '<li><a href="javascript:void(0)" class="sublinks active" onclick="openSub(event, \'Tab1-1\')">' + (mainCategories[uniqueTabs[0]])[0]  +'</a></li>' +
                              '<li><a href="javascript:void(0)" class="sublinks" onclick="openSub(event, \'Tab1-2\')">' + (mainCategories[uniqueTabs[0]])[1]  +'</a></li>' +
                              '<li><a href="javascript:void(0)" class="sublinks" onclick="openSub(event, \'Tab1-3\')">' + (mainCategories[uniqueTabs[0]])[2]  +'</a></li>' +
                           '</ul></div>' + 
                           '<div id="main-container">' +
                              '<div id="Tab1-1" class ="subcontent" style = "display:block"> <h3> TEST1 </h3> </div>'+ 
                              '<div id="Tab1-2" class ="subcontent" style = "display:none"> <h3> TEST2 </h3> </div>'+ 
                              '<div id="Tab1-3" class ="subcontent" style = "display:none"> <h3> TEST3 </h3> </div>'+ 
                           '</div>' + 
                        '</div>' + 
                    '</div>' + 
					' <div id="Tab2" class="tabcontent">' + 
                       '<div id="content">' + 
                           '<div id="tab-container"><ul>' +
                              '<li><a href="javascript:void(0)" class="sublinks2 active" onclick="openSub2(event, \'Tab2-1\')">' + (mainCategories[uniqueTabs[1]])[0]  +'</a></li>' +
                              '<li><a href="javascript:void(0)" class="sublinks2" onclick="openSub2(event, \'Tab2-2\')">' + (mainCategories[uniqueTabs[1]])[1]  +'</a></li>' +
                              '<li><a href="javascript:void(0)" class="sublinks2" onclick="openSub2(event, \'Tab2-3\')">' + (mainCategories[uniqueTabs[1]])[2]  +'</a></li>' +
                              '<li><a href="javascript:void(0)" class="sublinks2" onclick="openSub2(event, \'Tab2-4\')">' + (mainCategories[uniqueTabs[1]])[3]  +'</a></li>' +
                              '<li><a href="javascript:void(0)" class="sublinks2" onclick="openSub2(event, \'Tab2-5\')">' + (mainCategories[uniqueTabs[1]])[4]  +'</a></li>' +
                           '</ul></div>' + 
                           '<div id="main-container">' +
                              '<div id="Tab2-1" class ="subcontent2" style = "display:block"> <div id = "Tab2-1"></div> </div>'+ 
                              '<div id="Tab2-2" class ="subcontent2" style = "display:none"> <h3> TEST2 </h3> </div>'+ 
                              '<div id="Tab2-3" class ="subcontent2" style = "display:none"> <h3> TEST3 </h3> </div>'+ 
                              '<div id="Tab2-4" class ="subcontent2" style = "display:none"> <h3> TEST4 </h3> </div>'+ 
                              '<div id="Tab2-5" class ="subcontent2" style = "display:none"> <h3> TEST5 </h3> </div>'+ 
                           '</div>' + 
                        '</div>' + 
                    '</div>' 
					);
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
                var options = {'width':300, 'height':200 ,
                           'bar': {groupWidth: "15%"}
                          };

                // For tab 2-1, Temperature
                data21 = data;
                opt21 = options;
                data21.addRows([
                    [ (mainCategories[uniqueTabs[1]])[0] + ' (' + units[3] + ')', Number(locations[i][6]) ]
                ]);
                opt21.vAxis = { title: units[3] };
		        // Instantiate and draw our chart, passing in some options.
                var Tab21 = document.getElementById("Tab2-1");
                var chart21 = new google.visualization.ColumnChart(Tab21);
                chart21.draw(data21, opt21);
            

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

// For the tabs in the info window
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
