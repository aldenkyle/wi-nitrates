
//pulled this from https://codepen.io/lknarf/pen/JXybxX
var map = L.map("map", {
  center: [44.5, -89.7],
  zoom: 7
});

var Stamen_TonerLite = L.tileLayer(
  "http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
  {
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    minZoom: 0,
    maxZoom: 20,
    ext: "png"
  }
).addTo(map);

var myGeoJson;

var leafletLayers;

var geojsonMarkerOptions = {
  color: "green"
};

var url =
  "https://raw.githubusercontent.com/aldenkyle/wi-nitrates/main/data/well_nitrate.geojson";

$.ajax(url).done(function (data) {
  myGeoJson = JSON.parse(data);
  leafletLayers = L.geoJson(myGeoJson, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, geojsonMarkerOptions);
    }
  });
  leafletLayers.addTo(map);
});


var styleMarkers = function (closestPoints) {
  var artIds = _.map(closestPoints, function (point) {
    return point.properties.nitr_ran;
  });
  _.each(leafletLayers._layers, function (layer, index) {
    if (_.contains(artIds, layer.feature.properties.nitr_ran)) {
      layer.setStyle({ color: "orange", radius: 12 });
    } else {
      layer.setStyle({ color: "green", radius: 10 });
    }
  });
};




function getColor(d) {
    return d >10 ? '#800026' :
           d > 5  ? '#BD0026' :
           d > 4  ? '#E31A1C' :
           d > 3  ? '#FC4E2A' :
           d > 2   ? '#FD8D3C' :
           d > 1   ? '#FEB24C' :
           d > 0   ? '#FED976' :
                      '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.nitr_ran),
        weight: 0,
        opacity: 1,
        //color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}


var getInterpolatedPoints = function (e) {
  var allJson = _.clone(myGeoJson);
   // jsnBuffer= turf.buffer(leafletLayers.toGeoJSON(),20,{units:'kilometers'})
    //lyrBuffer = L.geoJSON(jsnBuffer, {style:{color:'yellow', dashArray:'5,5', fillOpacity:0}}).addTo()
  //var points = turf.points(allJson);
  var options = {gridType: 'square', property: 'nitr_ran', units: 'miles', weight: 2};
  var grid = turf.interpolate(leafletLayers.toGeoJSON(), 5, options);
  lyrBuffer = L.geoJSON(grid, {style:style}).addTo(map)
  //return grid;
    console.log(grid);
};



$("#interpolate").click(function(e){
        var closestPoints = getInterpolatedPoints(e)
    });


