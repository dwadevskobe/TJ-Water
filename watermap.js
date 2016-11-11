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

    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11,
        center: new google.maps.LatLng(32.352543, -117.123172),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow1 = new google.maps.InfoWindow();
    var infowindow2 = new google.maps.InfoWindow();

    var marker, i;

    // Go through all the beach locations
    for (i = 0; i < locations.length; i++) {
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
					'<ul class="tab" style = "list-style-type: none"> <li><a href="javascript:void(0)" class="tablinks active" onclick="openTab(event, \'Tab1\')" > Enterococos </a></li>' +
					'<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab2\')"> Tab2</a></li>' +  
					'<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab3\')"> Tab3</a></li>' + 
					'<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab4\')"> Tab4</a></li> </ul>' +
					' <div id="Tab1" class="tabcontent" style = "display:block"><h3>Enterococos</h3><p>' + locations[i][3] + '<div class="chart_div"></div></p></div>' +
					' <div id="Tab2" class="tabcontent"><h3>Tab2</h3><p> Tab2 Content <div class="chart_div"></div></p></div>' +
					' <div id="Tab3" class="tabcontent"><h3>Tab3</h3><p> Tab3 Content <div class="chart_div"></div></p></div>' +
					' <div id="Tab4" class="tabcontent"><h3>Tab4</h3><p> Tab4 Content <div class="chart_div"></div></p></div>');
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
		        data.addColumn('string', 'Topping');
		        data.addColumn('number', 'Slices');
		        data.addRows([
		          ['Mushrooms', 3],
		          ['Onions', 1],
		          ['Olives', 1],
		          ['Zucchini', 1],
		          ['Pepperoni', 2]
		        ]);

		        // Set chart options
		        var options = {'width':400, 'height':300};

		        // Instantiate and draw our chart, passing in some options.
            var graphs;
            graphs = document.getElementsByClassName("chart_div");
            for (i = 0; i < graphs.length; i++){
                var chart = new google.visualization.ColumnChart(graphs[i]);
                chart.draw(data, options);
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
