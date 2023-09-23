
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


var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'});


var baseMaps = {
    "Stamen Toner Lite": Stamen_TonerLite,
    "OpenStreetMap.HOT": osmHOT
};



var overlayMaps = {
};

var layerControl;
var layerControl = L.control.layers(baseMaps, overlayMaps, {position: 'bottomright'}).addTo(map);
var nitrateLayer;
var myGeoJson;

var tractLayer;

function getNitrateColor(d) {
    return d >10 ? '#014636' :
           d > 7.5 ? '#016c59':
           d > 5  ? '#02818a' :
           d > 4  ? '#3690c0' :
           d > 3  ? '#67a9cf' :
           d > 2   ? '#a6bddb' :
           d > 1   ? '#d0d1e6' :
           d > 0   ? '#ece2f0' :
                      '#fff7fb';
}



function cancerColor(d) {
    return d >.8 ? '#7f0000' :
           d >.65 ? '#b30000' :
           d >.5  ? '#d7301f' :
           d > .4  ? '#ef6548' :
           d > .3  ? '#fc8d59' :
           d > .2   ? '#fdbb84' :
           d > .1   ? '#fdd49e' :
           d > 0   ? '#fee8c8' :
                      '#fff7ec';
}

function style0(feature) {
    return {
        fillColor: cancerColor(feature.properties.canrate),
        weight: .7,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}


var url =
  "https://raw.githubusercontent.com/aldenkyle/wi-nitrates/main/data/cancer_tracts.json";

$.ajax(url).done(function (data) {
  tracts = JSON.parse(data);
  tractLayer = L.geoJson(tracts, {style:style0});
  tractLayer.addTo(map);
  layerControl.addOverlay(tractLayer, "Cancer Rate by Census Tract");
  tractLayer.bringToBack()
});


function style(feature) {
    return {
        fillColor: getNitrateColor(feature.properties.nitr_ran),
        weight: 0,
        opacity: 1,
        //color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}



//add nitrate well locations, styled

var url =
  "https://raw.githubusercontent.com/aldenkyle/wi-nitrates/main/data/well_nitrate.geojson";

$.ajax(url).done(function (data) {
  myGeoJson = JSON.parse(data);
  nirtrateLayer = L.geoJson(myGeoJson, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, geoJsonMakerOptions = {
              fillColor: getNitrateColor(feature.properties.nitr_ran),
      weight: 0,
      radius:4,
      fillOpacity:1,
      opacity:1});
    }
  });
  nirtrateLayer.addTo(map);
  layerControl.addOverlay(nirtrateLayer, "Nitrate Concentrations")
  tractLayer.bringToBack()
});



function style2(feature) {
    return {
        fillColor: getNitrateColor(feature.properties.mean),
        weight: .7,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}




//set up function to run the analysis
var getInterpolatedPoints = function (e) {
  var allJson = _.clone(myGeoJson);
   // get IDW exponent from app
  var idw_weight = Number(document.getElementById('idwFactor').value)
  //console.log(idw_weight)
  var idw_dist_map = 3
  var idw_dist_points = 3
  var options = {gridType: 'square', property: 'nitr_ran', units: 'miles', weight: idw_weight};
  var grid = turf.interpolate(nirtrateLayer.toGeoJSON(), idw_dist_map, options);
  lyrBuffer = L.geoJSON(grid, {style:style}).addTo(map);
  layerControl.addOverlay(lyrBuffer, "Interpolated Nitrate Concentrations")
  var ptoptions = {gridType: 'point', property: 'nitr_ran', units: 'miles', weight: idw_weight};
  var grid_pts = turf.interpolate(nirtrateLayer.toGeoJSON(), idw_dist_points, ptoptions);
  //console.log(grid_pts) ;
  var collectCncr =  turf.collect(tractLayer.toGeoJSON(),grid_pts, 'nitr_ran', 'values');
 
  // finds the mean of the grid points in each tract, if no points in a tract, use the value of the closest point to the centroid
  collectCncr.features.forEach(function (feature) {
    try {feature.properties.mean = ss.mean(feature.properties.values);
        } catch(error) {
      //console.error(error)
        var centroid = turf.centroid(feature);
        var nearestPt = turf.nearestPoint(centroid, grid_pts)
        //console.log(nearestPt)
        feature.properties.mean = nearestPt.properties.nitr_ran
  }
        });
  //console.log(collectCncr);
    //add layer to the map showing the nitrate rates in each tract to check it out
    
    lyrNitrates =  L.geoJSON(collectCncr, {style:style2}).addTo(map);
    layerControl.addOverlay(lyrNitrates, "Nitrate Concentrations per Census Tract")
    nirtrateLayer.bringToFront()
    
    //use simplestatistics to run regression
    
    //get r squared and add it to map
    
    // add a layer that shows the distribution of residuals
};






$("#interpolate").click(function(e){
        try { map.removeLayer(lyrBuffer);
            } catch(error)  {
              console.error(error);
              // Expected output: ReferenceError: nonExistentFunction is not defined
              // (Note: the exact output may be browser-dependent)
            }

        var closestPoints = getInterpolatedPoints(e)
    });


