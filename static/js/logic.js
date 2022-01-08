// create the title layers for the background of the map
var defaultMap = OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

// water color layer
var watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});

// Topography
let topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make basemaps object
let basemaps = {
    Grayscale: grayscale,
    "Water Color": watercolor,
    "Topography": topoMap,
    Default: defaultMap
};

// create a map object

var myMap = L.map("map", {
    center: [64.2008, -149.4937],
    zoom: 5,
    layers: [grayscale, watercolor, topoMap, defaultMap]

});

// add default map to the map
defaultMap.addTo(myMap);

//add the layer control


//get data for tectonic plates and draw on the map
// varaiable to hold the tectonic plates layer
let tectonicplates = new L.layerGroup();

// call the api to get the info for the tectonic plates

d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function(plateData){

// console log for data to load
//console.log(platedata);

// load data using GeoJson and add to the tectonic plates layer group

L.geoJson(plateData,{
    // add styling to make lines visible
    color: "yellow",
    weight: 1

}).addTo(tectonicplates);

});

// add tectonic plates to the map
tectonicplates.addTo(myMap);

//varaiable to hold the earthquake data layer
let earthquakes = new L.layerGroup();

// get data for earthquakes & populaate the layer group

// call the USGS GeoJSON API

d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(
    function(earthquakeData){
        //onsole log for data to load
        console.log(earthquakeData);

        // plot circles, where the radius is dependent on the magnitude
        // and the color is dependent on the depth

        // make a function that chooses the color of the data point
        function dataColor(depth){
            if (depth >90)
                return "red";
            else if(depth > 70)
                return "#fc4903";
            else if(depth > 50)
                return "#fc8403";
            else if(depth > 30)
                return "#fcad03";
            else if(depth > 10)
                return "#cafc03";
            else 
                return "green";
        }

        // make a function to determine the size of our radius
        function radiusSize(mag){
            if (mag == 0)
            return 1; // makes sure that a 0 mag earthquake shows up
            else
                return mag * 5; // makes sure that the circle is pronounced in the map
        }

        // add on the style for each data point
        function dataStyle(feature)
        {
            return {
                opacity: 0.5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]), // used index 2 for Depth
                color: "000000", // black outline
                radius: radiusSize(feature.properties.mag), // grabs the magnitude
                weight: 05,
                stroke: true
            }
        }

        // add the GeoJsn Data to earthquake layer group
        L.geoJson(earthquakeData, {

            // make each feature a marker that is on the map,@ marker is a circle
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng);
            },
            // set the style for each marker
            style: dataStyle, // calls the data style function and passes in the earthquake data

            // add pop-ups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                Depth: <b>${feature.geometry.coordinates[2]}</b><br>Location: <b>${feature.properties.place}</b>`);
            }


        }).addTo(earthquakes);
    }

);

// add the earthquake layer to the map
earthquakes.addTo(myMap);

// add the overlay for the tectonic plates & earthquakes

let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes

};

// add the layer control

L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

// add the legend to the map

let legend = L.control({
    position: "bottomright"

});

// add properties of the legend
legend.onAdd = function() {
    // div for the legend to appear in the page
    let div = L.DomUtil.create("div", "info legend");

    // set up the intervals

    let intervals = [-10, 10, 30, 50, 70, 90];

    // set the colors for the intervals

    let colors = [
        "green",
        "#cafc03",
        "#fcad03",
        "#fc8403",
        "#fc4903",
        "red"
    ];

    // loop thro the intervals & the colors to generate a label
    // with a colored square for each interval

    for(var i =0; i < intervals.length; i++)
    {
        // inner HTML that sets the square for each interval and label
        div.innerHTML += "<i style= 'background: "
        + colors[i]
        + "'></i> "
        + intervals [i]
        + (intervals[i + 1] ? "km &ndash km;" + intervals[i + 1] + "km<br>" : "+");
    }
    return div;

};

// add the legend to the map

legend.addTo(myMap);