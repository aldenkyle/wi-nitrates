
//pulled this from https://codepen.io/lknarf/pen/JXybxX
var map = L.map("map", {
  center: [45, -91.5],
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
var layerControl = L.control.layers(baseMaps, overlayMaps, {collapsed:false, position: 'topright'}).addTo(map);
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
  //tractLayer.bringToBack()
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


function style3(feature) {
    return {
        fillColor: cancerColor(feature.properties.predicted),
        weight: .7,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}


function residColor(d) {
    return d >.4 ? '#542788' :
           d >.3 ? '#8073ac' :
           d >.2  ? '#b2abd2' :
           d > .1  ? '#d8daeb' :
           d > 0  ? '#f7f7f7' :
           d > -.1   ? '#fee0b6' :
           d > -.2   ? '#fdb863' :
           d > -.3   ? '#e08214' :
                      '#b35806';
}



function style4(feature) {
    return {
        fillColor: residColor(feature.properties.residual),
        weight: .7,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}


var legend = L.control({position: 'topright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0,.1,.2,.3,.4,.5,.65,.8],
        nitr_conc = [0,1,2,3,4,5,7.5,10],
        labels = ['<strong>Cancer Rates</strong>'];

    // loop through our density intervals and generate a label with a colored square for each interval
    div.innerHTML += '<strong>Cancer Rates per 100,000</strong><br><br>';
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML += 
            '<i style="background:' + cancerColor(grades[i] + .01) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    div.innerHTML += '<br><br><strong>Nitrate Concentration Measurements</strong><br>';
     for (var i = 0; i < grades.length; i++) {
        div.innerHTML += 
            '<i style="background:' + getNitrateColor(nitr_conc[i] + .01) + '"></i> ' +
            nitr_conc[i] + (nitr_conc[i + 1] ? '&ndash;' + nitr_conc[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);


//set up function to run the analysis
var getInterpolatedPoints = function (e) {
    console.log("running analysis function")
  var allJson = _.clone(myGeoJson);
   // get IDW exponent from app
  var idw_weight = Number(document.getElementById('idwFactor').value)
  //console.log(idw_weight)
  var idw_dist_map = 3
  var idw_dist_points = 3
  var options = {gridType: 'square', property: 'nitr_ran', units: 'miles', weight: idw_weight};
  var grid = turf.interpolate(nirtrateLayer.toGeoJSON(), idw_dist_map, options);
  lyrBuffer = L.geoJSON(grid, {style:style});
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
    //create an array from the tractOutPUt
    var allFeaturesArray = [];
    collectCncr.features.forEach(function (feature) { 
    ftrArray = [feature.properties.mean, feature.properties.canrate]
    allFeaturesArray.push(ftrArray);
    })
    //get r squared and add it to map
    var linearReg = ss.linearRegression(allFeaturesArray);
    //console.log(linearReg);
    var regressionLine = ss.linearRegressionLine(linearReg);
    var r2 = ss.rSquared(allFeaturesArray, regressionLine);
    //console.log(r2)
    // add a layer that shows the distribution of residuals
    collectCncr.features.forEach(function (feature) { 
    feature.properties.predicted = (feature.properties.mean * linearReg.m) + linearReg.b
    //console.log(feature.properties.predicted)
    //console.log(feature.properties.canrate)
    feature.properties.residual = feature.properties.predicted - feature.properties.canrate
    })
    lyrPredicted =  L.geoJSON(collectCncr, {style:style3});
    layerControl.addOverlay(lyrPredicted, "Predicted Cancer Rates")
    
    lyrResid =  L.geoJSON(collectCncr, {style:style4});
    layerControl.addOverlay(lyrResid, "Predicted Cancer Rate Residuals")
    
    var statement 
    var htmlcontent = '<p class="para1" style="color:white; font-size: 1.3em; font-weight: bold; text-align: left; line-height:normal; margin-top:-10px; margin-left:20px; margin-right:10px"><br><br>'
    if (r2<.2) {statement = htmlcontent + 'Output: The resulting r-squared value, using a distance exponent of '+ idw_weight +' is '+ r2.toString().substring(0,4) +',  ' + 'indicating that there is little correlation between nitrate concentrations and cancer rates in Wisconsin.</p>'}
    else if (r2<.5) {statement = htmlcontent +  'Output: The resulting r-squared value is '+ r2.toString().substring(0,4) +', indicating that there is a moderate correlation between nitrate concentrations and cancer rates in Wisconsin.</p>'}
    else if (r2<.8) {statement = htmlcontent + 'Output: The resulting r-squared value is '+ r2.toString().substring(0,4) +', indicating that there is a potentially a strong correlation between nitrate concentrations and cancer rates in Wisconsin.</p>'}
    else  {statement = htmlcontent + 'Output: The resulting r-squared value is '+ r2.toString().substring(0,4) +', indicating that there is a very strong correlation between nitrate concentrations and cancer rates in Wisconsin.</p>'}
    
    //var theDiv = document.getElementById("head-desc");;
    //var content = document.createTextNode(statement);
    //theDiv.appendChild(content);
    
    var div = document.getElementById('head-desc');
    div.innerHTML += statement;
    
};






$("#interpolate").bind('click', function(e){
        var closestPoints = getInterpolatedPoints(e);
        console.log('analysis finished')
    });


$("#reset").bind('click', function(e){
       console.log("hit reset")
        try { layerControl.removeLayer(lyrBuffer);
            } catch(error)  {
              console.error(error);
              // Expected output: ReferenceError: nonExistentFunction is not defined
              // (Note: the exact output may be browser-dependent)
            }
        try { layerControl.removeLayer(lyrNitrates);
            } catch(error)  {
              console.error(error);
              // Expected output: ReferenceError: nonExistentFunction is not defined
              // (Note: the exact output may be browser-dependent)
                    }
         try { layerControl.removeLayer(lyrResid);
                    } catch(error)  {
                      console.error(error);
                      // Expected output: ReferenceError: nonExistentFunction is not defined
                      // (Note: the exact output may be browser-dependent)
                    }
         try { layerControl.removeLayer(lyrPredicted);
                    } catch(error)  {
                      console.error(error);
                      // Expected output: ReferenceError: nonExistentFunction is not defined
                      // (Note: the exact output may be browser-dependent)
                    }});

