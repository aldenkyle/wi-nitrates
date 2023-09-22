
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

var getClosestPoints = function (e) {
  var allJson = _.clone(myGeoJson);
  var point = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [e.latlng.lng, e.latlng.lat]
    }
  };
  var closest = [];
  for (var i = 1; i < 20; i++) {
    near = turf.nearest(point, allJson);
    closest.push(near);
    allJson = {
      type: "FeatureCollections",
      features: _.without(allJson.features, near)
    };
  }
  return closest;
};

map.on("mousemove", function (e) {
  var closestPoints = getClosestPoints(e);
  styleMarkers(closestPoints);
});
