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
			
        // When you click on a marker, It shows all the tabs
        google.maps.event.addListener(marker, 'click', (function(marker, i) {		
			return function() {
                var contentString = '<h2 style = display:inline;>' + locations[i][0] + '</h2><p style="color:green; display:inline; margin-left:10px"><b>SAFE</b></p><br>' +
                    '<select style = "margin-top:15px">' + 
                       '<option value = "pfea"> PFEA </option>' +
                       '<option value = "cespt"> CESPT </option>' +
                       '<option value = "cofepris"> COFEPRIS </option>' +
                    '</select>' +
                    '<ul class="tab" style = "list-style-type:none; margin-top:15px">' + 
                       '<li><a href="javascript:void(0)" class="tablinks active" onclick="openTab(event, \'Tab1\')" style = "padding:8px">'+ uniqueTabs[0] + '</a></li>' +
                       '<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab2\')" style = "padding:8px">' + uniqueTabs[1] + '</a></li>' +
                    '</ul>' +  

                    ' <div id="Tab1" class="tabcontent" style = "display:block">' +
                        '<div id="content">' + 
                           '<div id="tab-container"><ul>' +
                              '<li><a href="javascript:void(0)" class="sublinks active" onclick="openSub(event, \'Tab1-1\')">' + (mainCategories[uniqueTabs[0]])[0]  +'</a></li>' +
                              '<li><a href="javascript:void(0)" class="sublinks" onclick="openSub(event, \'Tab1-2\')">' + (mainCategories[uniqueTabs[0]])[1]  +'</a></li>' +
                              '<li><a href="javascript:void(0)" class="sublinks" onclick="openSub(event, \'Tab1-3\')">' + (mainCategories[uniqueTabs[0]])[2]  +'</a></li>' +
                           '</ul></div>' + 
                           '<div id="main-container">' +
                              '<div id="Tab1-1" class ="subcontent" style = "display:block"> <div id = "Tab1-1"></div> </div>'+ 
                              '<div id="Tab1-2" class ="subcontent" style = "display:none"> <div id = "Tab1-2"></div> </div>'+ 
                              '<div id="Tab1-3" class ="subcontent" style = "display:none"> <div id = "Tab1-3"></div></div>'+ 
                           '</div>' + 
                        '</div>' + 
                    '</div>' + 
                    ' <div id="Tab2" class="tabcontent">' + 
                       '<div id="content">' + 
                           '<div id="tab-container"><ul>'
                
                contentString = contentString + '<li><a href="javascript:void(0)" class="sublinks2 active" onclick="openSub2(event, \'Tab2-1\')">' + (mainCategories[uniqueTabs[1]])[0]  +'</a></li>';

                // for loop to loop through inner tabs
                var j;
                for(j = 1; j < (mainCategories[uniqueTabs[1]]).length; j++)
                {
                    contentString = contentString + '<li><a href="javascript:void(0)" class="sublinks2" onclick="openSub2(event, \'Tab2-'+ j+1 + '\')">' + (mainCategories[uniqueTabs[1]])[j]  +'</a></li>';
                }
                contentString = contentString + 
                     '</ul></div>' + 
                           '<div id="main-container">' +
                              '<div id="Tab2-1" class ="subcontent2" style = "display:block"> <div id = "Tab2-1"></div> </div>'+ 
                              '<div id="Tab2-2" class ="subcontent2" style = "display:none"> <div id = "Tab2-2"></div>  </div>'+ 
                              '<div id="Tab2-3" class ="subcontent2" style = "display:none"> <div id = "Tab2-3"></div> </div>'+ 
                              '<div id="Tab2-4" class ="subcontent2" style = "display:none"> <div id = "Tab2-4"></div> </div>'+ 
                              '<div id="Tab2-5" class ="subcontent2" style = "display:none"> <div id = "Tab2-5"></div> </div>'+ 
                              '<div id="Tab2-6" class ="subcontent2" style = "display:none"> <div id = "Tab2-6"></div> </div>'+ 
                              '<div id="Tab2-7" class ="subcontent2" style = "display:none"> <div id = "Tab2-7"></div> </div>'+ 
                              '<div id="Tab2-7" class ="subcontent2" style = "display:none"> <div id = "Tab2-8"></div> </div>'+ 
                           '</div>' + 
                        '</div>' + 
                    '</div>' ;
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

                 // For tab 1-1, Enterococos
                data11 = data.clone();
                data11.addRows([
                    [ (mainCategories[uniqueTabs[0]])[0] + ' (' + units[0] + ')', Number(locations[i][3]) ]
                ]);
                var Tab11 = document.getElementById("Tab1-1");
                var chart11 = new google.visualization.ColumnChart(Tab11);
                chart11.draw(data11, options);

                 // For tab 1-2, Califormes Totales
                data12 = data.clone();
                data12.addRows([
                    [ (mainCategories[uniqueTabs[0]])[1], Number(locations[i][4]) ]
                ]);
                var Tab12 = document.getElementById("Tab1-2");
                var chart12 = new google.visualization.ColumnChart(Tab12);
                chart12.draw(data12, options);

                 // For tab 1-3, Califormes Fecales
                data13 = data.clone();
                data13.addRows([
                    [ (mainCategories[uniqueTabs[0]])[2], Number(locations[i][5]) ]
                ]);
                var Tab13 = document.getElementById("Tab1-3");
                var chart13 = new google.visualization.ColumnChart(Tab13);
                chart13.draw(data13, options);

                // For tab 2-1, Temperature
                data21 = data.clone();
                data21.addRows([
                    [ (mainCategories[uniqueTabs[1]])[0] + ' (' + units[3] + ')', Number(locations[i][6]) ]
                ]);
                var Tab21 = document.getElementById("Tab2-1");
                var chart21 = new google.visualization.ColumnChart(Tab21);
                chart21.draw(data21, options);
            
                // For tab 2-2, Potencial 
                data22 = data.clone();
                data22.addRows([
                    [ (mainCategories[uniqueTabs[1]])[1] + ' (' + units[4] + ')', Number(locations[i][7]) ]
                ]);
                var Tab22 = document.getElementById("Tab2-2");
                var chart22 = new google.visualization.ColumnChart(Tab22);
                chart22.draw(data22, options);

                // For tab 2-3, Conductividad
                data23 = data.clone();
                data23.addRows([
                    [ (mainCategories[uniqueTabs[1]])[2] + ' (' + units[5] + ')', Number(locations[i][8]) ]
                ]);
                var Tab23 = document.getElementById("Tab2-3");
                var chart23 = new google.visualization.ColumnChart(Tab23);
                chart23.draw(data23, options);

                // For tab 2-4, Oxigeno
                data24 = data.clone();
                data24.addRows([
                    [ (mainCategories[uniqueTabs[1]])[3] + ' (' + units[6] + ')', Number(locations[i][9]) ]
                ]);
                var Tab24 = document.getElementById("Tab2-4");
                var chart24 = new google.visualization.ColumnChart(Tab24);
                chart24.draw(data24, options);

                // For tab 2-5, Solidos
                data25 = data.clone();
                data25.addRows([
                    [ (mainCategories[uniqueTabs[1]])[4] + ' (' + units[7] + ')', Number(locations[i][10]) ]
                ]);
                var Tab25 = document.getElementById("Tab2-5");
                var chart25 = new google.visualization.ColumnChart(Tab25);
                chart25.draw(data25, options);

                // For tab 2-6, Densidad
                data26 = data.clone();
                data26.addRows([
                    [ (mainCategories[uniqueTabs[1]])[5] + ' (' + units[8] + ')', Number(locations[i][11]) ]
                ]);
                var Tab26 = document.getElementById("Tab2-6");
                var chart26 = new google.visualization.ColumnChart(Tab26);
                chart26.draw(data26, options);

                // For tab 2-7, Solidos
                data27 = data.clone();
                data27.addRows([
                    [ (mainCategories[uniqueTabs[1]])[6] + ' (' + units[9] + ')', Number(locations[i][12]) ]
                ]);
                var Tab27 = document.getElementById("Tab2-7");
                var chart27 = new google.visualization.ColumnChart(Tab27);
                chart27.draw(data27, options);

                // For tab 2-8, Resistividad
                data28 = data.clone();
                data28.addRows([
                    [ (mainCategories[uniqueTabs[1]])[7] + ' (' + units[10] + ')', Number(locations[i][13]) ]
                ]);
                var Tab28 = document.getElementById("Tab2-8");
                var chart28 = new google.visualization.ColumnChart(Tab28);
                chart28.draw(data28, options);

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
