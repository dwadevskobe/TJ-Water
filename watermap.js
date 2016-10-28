var locations = [
  ['San Antonio Del Mar', 32.430879, -117.099590],
  ['El Faro',             31.778962, -116.616930],
  ['Playa El Vigia',      32.502543, -117.123172],
  ['Parque Mexico',       32.527274, -117.123886],
  //['Maroubra Beach', -33.950198, 151.259302, 1]
];

var map = new google.maps.Map(document.getElementById('map'), {
  zoom: 11,
  center: new google.maps.LatLng(32.502543, -117.123172),
  mapTypeId: google.maps.MapTypeId.ROADMAP
});

var infowindow = new google.maps.InfoWindow();

var marker, i;

for (i = 0; i < locations.length; i++) {
  marker = new google.maps.Marker({
    position: new google.maps.LatLng(locations[i][1], locations[i][2]),
    map: map
  });

  google.maps.event.addListener(marker, 'click', (function(marker, i) {
    return function() {
      infowindow.setContent(locations[i][0] + '<p style="color:green;"><b>SAFE</b></p>' +
      '<ul class="tab"> <li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab1\')" id="defaultOpen"> Tab1 </a></li>' +
      '<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab2\')"> Tab2</a></li>' +  
      '<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab3\')"> Tab3</a></li>' + 
      '<li><a href="javascript:void(0)" class="tablinks" onclick="openTab(event, \'Tab4\')"> Tab4</a></li> </ul>' +


      ' <div id="Tab1" class="tabcontent"><h3>Tab1</h3><p> Tab1 Content </p></div>' +
      ' <div id="Tab2" class="tabcontent" style = "display:none" ><h3>Tab2</h3><p> Tab2 Content </p></div>' +
      ' <div id="Tab3" class="tabcontent" style = "display:none"><h3>Tab3</h3><p> Tab3 Content </p></div>' +
      ' <div id="Tab4" class="tabcontent" style = "display:none"><h3>Tab4</h3><p> Tab4 Content </p></div>' );
      infowindow.open(map, marker);
    }
  })(marker, i));
}


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