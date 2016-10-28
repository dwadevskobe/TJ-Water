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
      '<ul class="tabs">  <li><a href="javascript:void(0)">Tab1</a></li>   <li><a href="javascript:void(0)">Tab2</a></li>  <li><a href="javascript:void(0)">Tab3</a></li>  <li><a href="javascript:void(0)">Tab4</a></li> </ul>' +
      ' <section class="tab_content" id="tab1"> <p> Tabbed Conternt 1</p>  </section>'   +
      ' <section class="tab_content" id="tab2"> <p> Tabbed Conternt 2</p>  </section>'   +
      ' <section class="tab_content" id="tab3"> <p> Tabbed Conternt 3</p>  </section>'   +
      ' <section class="tab_content" id="tab4"> <p> Tabbed Conternt 4</p>  </section>'  );
      infowindow.open(map, marker);
    }
  })(marker, i));
}