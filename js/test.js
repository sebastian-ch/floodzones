(function () {
    
    //nav accordion
    $('#accordion').accordion({
        //active: false,
        collapsible: true
    });

    var map = L.map('map', {
        zoomSnap: .1,
        center: [37.5328, -77.4318],
        zoom: 15,
        maxZoom: 18

    });
    var service = L.esri.featureLayerService({
        url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28'
    });
    var searchAddress = "",
        searchLatLng, //inputAddress
        currentLocation,
        radiusLocation;
    var floodLayerGroup = L.layerGroup(); //layergroup of flood maps
    
    //add basemap control
    var baseControl = L.control({
        position: 'topright'
    });
    baseControl.onAdd = function (map) {
        var div = L.DomUtil.get("togGroup");
        return div;
    }
    baseControl.addTo(map);
    
    //add legend control
    var legendControl = L.control({
        position: 'bottomleft'
    });
    legendControl.onAdd = function (map) {
        var lDiv = L.DomUtil.get("legend");
        return lDiv;
    }
    legendControl.addTo(map);

    //jquery to grab the input text and query the map based
    //on it. Also if "enter" is pressed, it will do the same
    //as if you hit the "search" button
    $('.input').bind("enterKey", function (e) {
        searchAddress = $('.input').val();
        $('.loading').show();
        geocodeAddress(searchAddress);
    });

    $('.btn').on('click', function (e) {
        searchAddress = $('.input').val();
        $('.loading').show();
        geocodeAddress(searchAddress);
    })

    $('.input').keyup(function (e) {
        if (e.keyCode == 13) {
            $(this).trigger("enterKey");
        }
    });

    //try and locate the user
    map.locate({
        setView: true,
    });


    //if you can locate the user, change the bounds, zoom
    //run map query based off new bounds
    map.on('locationfound', onLocationFound);
    //if you can't locate the user, just use the current bounds
    map.on('locationerror', onLocationError);


    //if you find the location, add a marker and reset the bounds
    function onLocationFound(e) {
        currentLocation = L.marker(e.latlng).addTo(map);
        //radiusLocation = L.circle(e.latlng, {radius: 5000});
        //radiusLocation.addTo(map);

        map.setZoom(14);
        var bounds = map.getBounds().pad(0.05);
        console.log(bounds);
        var center = map.getCenter();
        map.setZoom(14);

        queryFloodMap(bounds);
    }

    //if you don't find the location, use the initial map state
    function onLocationError() {
        var bounds = map.getBounds().pad(0.05);
        var center = map.getCenter();
        queryFloodMap(bounds);
    }

    //function to deal with the basemap toggle
    function baseMapControl() {
        
        //initial basemap toggle value
        var baseName = $('#togGroup input').val();
        var tileLayer = L.esri.basemapLayer(baseName).addTo(map);
        var baseLabels = L.esri.basemapLayer(baseName + 'Labels').addTo(map);

        $('#togGroup input').change(function (e) {
            
            map.removeLayer(tileLayer);
            map.removeLayer(baseLabels);

            baseName = $(this).val();
            console.log(baseName);

            tileLayer = L.esri.basemapLayer(baseName);
            baseLabels = L.esri.basemapLayer(baseName + 'Labels').addTo(map);

            tileLayer.addTo(map);
            baseLabels.addTo(map);
        });

    }

    //queries the map service - searches for all features that
    //intersect the bounds of the map,
    //only includes needed fields,
    //where the area is larger than .000001,
    //sets the precision to 4 decimal places,
    //simplifies polygons (0-1 scale)
    //once complete, run makeMap() and createLegend() with data
    function queryFloodMap(bounds) {

        service.query()
            //.within(bounds)
            .intersects(bounds)
            //.nearby(currentLocation.getLatLng(), 800000)
            .fields(['OBJECTID', 'DFIRM_ID', 'FLD_ZONE', 'SFHA_TF', 'SHAPE.AREA'])
            .where("SHAPE.AREA >= '.000001'")
            .precision(4)
            .simplify(map, 0.30)
            .run(function (error, featureCollection, response) {

                console.log(featureCollection);

                //console.log(typeof(featureCollection.features));
                //console.log(featureCollection);

                makeMap(featureCollection);
                createLegend(featureCollection);

            })
    }

    //add the queried map data to the map
    function makeMap(data) {

        var floodLayer = L.geoJson(data, {
            
            //style it based on flood zone type
            style: function (feature) {

                if (feature.properties["FLD_ZONE"] == 'X') {
                    return {
                        color: '#448ee4',
                        fillOpacity: 0.2,
                        weight: 1
                    }
                } else {
                    return {

                        color: '#dc2b28',
                        fillOpacity: 0.2,
                        weight: 1
                    }
                }
            }
            //add it to a group so I can remove it when a user searches for a new area
        }).addTo(floodLayerGroup);

        //add popup
        var popupTemplate = "<h3>Flood Zone: {FLD_ZONE}</h3>";

        floodLayer.bindPopup(function (e) {
            return L.Util.template(popupTemplate, e.feature.properties)
        });


        //add basemap at the same time as the data loads
        baseMapControl();
        floodLayerGroup.addTo(map);
        //remove the loading spinner
        $('.loading').hide();
        createLocationPopup(floodLayer);

    }

    //creates the legend dynamically
    //only shows the flood zones that appear on the map instead of all of them.
    function createLegend(data) {

        var Qjson = jsonQ(data);
        var allZones = Qjson.find('FLD_ZONE');
        var legendContent = allZones.unique();
        /*var shap1 = Qjson.find('SHAPE.AREA');
        var shap1Content = shap1.unique();
        console.log(shap1Content); */
        var legendColor;

        for (var i = 0; i < legendContent.length; i++) {

            if (legendContent[i] == 'A' || legendContent[i] == 'AE') {
                legendColor = 'red';
            } else {
                legendColor = 'blue';
            }

            document.getElementById("addColor").innerHTML +=
                '<span class="w24 h24" style="opacity:0.4;background-color:' + legendColor + '"></span>';

            document.getElementById("addLabel").innerHTML += '<p id="label">' + legendContent[i] + '</p>';
        }

        //eventually - highlight the legend and all of those zones will 
        //highlight on the map
        
      /*  $('#legend span').hover(function () {
            $(this).css("border", "2px solid yellow");
        }, function () {
            $(this).css("border", "none");
        }); */
    }

    //when an address is entered and you hit enter or the button,
    //geocode the address and call findNewLocation() with the latlng
    function geocodeAddress(address) {

        L.esri.Geocoding.geocode().text(address).run(function (err, results) {

            searchLatLng = L.latLng(results.results["0"].latlng.lat, results.results["0"].latlng.lng);
            findNewLocation(searchLatLng);

        });
    }
    
    function findNewLocation(latLng) {

        //remove the current marker
        currentLocation.remove();

        //clear legend info
        document.getElementById("addColor").innerHTML = '';
        document.getElementById("addLabel").innerHTML = '';

        //add a new marker at the new location
        currentLocation = L.marker(searchLatLng).addTo(map);
        map.setView(latLng, 14);

        //clear old flood data from map
        floodLayerGroup.clearLayers();
        //get new bounds and center
        bounds = map.getBounds().pad(1);
        center = map.getCenter();
        //new query with new bounds
        queryFloodMap(bounds);
        console.log(bounds);

    }

    //use point in polygon to find out what flood zone the marker is in
    //and give it a popup
    function createLocationPopup(floodLayer) {

        var results = leafletPip.pointInLayer(currentLocation.getLatLng(), floodLayer);
        console.log(results);
        if (results.length != 0) {
            currentLocation.bindPopup("The marker falls in flood zone " + results["0"].feature.properties.FLD_ZONE).openPopup();
        }
    }

})();