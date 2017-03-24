(function () {

    //nav accordion
    $('#accordion').accordion({
        active: false,
        collapsible: true,
        heightStyle: "content"
    });

    var map = L.map('map', {
            zoomSnap: .1,
            //center: [37.5328, -77.4318],
            //zoom: 14,
            maxZoom: 17,
            minZoom: 12

        }),
        floodZoneService = L.esri.featureLayerService({
            url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28'
        }),
        //lomaService = L.esri.featureLayerService({}),
        //firmPanelService = L.esri.featureLayerService({}),
        searchAddress = "",
        searchLatLng, //inputAddress
        currentLocation,
        radiusLocation,
        floodLayerGroup = L.layerGroup(); //layergroup of flood maps

    //add legend control, basemap control,
    //basemap change function
    addControls();
    baseMapControl();
    //initial basemap
    var tileLayer = L.esri.basemapLayer('Gray').addTo(map);
    var baseLabels = L.esri.basemapLayer('GrayLabels').addTo(map);

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
        radiusLocation = L.circle(e.latlng, {
            radius: 5000,
            opacity: 0,
            fillOpacity: 0
        });
        radiusLocation.addTo(map);
        radiusLocation.bringToBack();

        map.setZoom(15);
        var bounds = map.getBounds();
        console.log(bounds);

        queryFloodMap(radiusLocation.getBounds());
    }

    //if you don't find the location, use the initial map state
    function onLocationError() {

        map.setView([37.5328, -77.4318], 15);
        var bounds = map.getBounds();
        queryFloodMap(bounds);
    }

    function addControls() {

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
    }

    //function to deal with the basemap toggle
    function baseMapControl() {

        //initial basemap toggle value
        var baseName = $('#togGroup input').val();

        $('#togGroup input').change(function (e) {

            map.removeLayer(tileLayer);

            if (baseLabels) {
                map.removeLayer(baseLabels);
            }

            baseName = $(this).val();
            console.log(baseName);

            tileLayer = L.esri.basemapLayer(baseName);
            tileLayer.addTo(map);

            if (baseName != 'Topographic') {
                baseLabels = L.esri.basemapLayer(baseName + 'Labels');
                baseLabels.addTo(map);
            }

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

        floodZoneService.query()
            .intersects(bounds)
            .fields(['OBJECTID', 'FLD_ZONE', 'SFHA_TF'])
            .where("SHAPE.AREA >= '.000001'")
            .where("NOT ZONE_SUBTY = 'AREA OF MINIMAL FLOOD HAZARD'")
            .precision(4)
            .simplify(map, 0.25)
            .run(function (error, featureCollection, response) {

                makeMap(featureCollection);
                createLegend(featureCollection);

            })
    }

    //add the queried map data to the map
    function makeMap(data) {

        floodLayerGroup.clearLayers();

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
                /*   onEachFeature: function (feature, layer) {
                           var popupTemplate = "<p>Flood Zone: {FLD_ZONE}</p>";

                           layer.bindPopup(function (e) {
                               return L.Util.template(popupTemplate, e.feature.properties)
                           });

                       } */
                //add it to a group so I can remove it when a user searches for a new area
        }).addTo(floodLayerGroup);


        floodLayerGroup.addTo(map);
        //remove the loading spinner
        $('.loading').hide();
        retrieveInfo(floodLayerGroup);
        //createLocationPopup(floodLayerGroup);

    }

    map.on('dragend', function () {

        updateOnMove();

    })

    //creates the legend dynamically
    //only shows the flood zones that appear on the map instead of all of them.
    function createLegend(data) {

        document.getElementById("addColor").innerHTML = '';
        document.getElementById("addLabel").innerHTML = '';

        var Qjson = jsonQ(data);
        var allZones = Qjson.find('FLD_ZONE');
        var legendContent = allZones.unique();
        var legendColor;

        for (var i = 0; i < legendContent.length; i++) {

            if (legendContent[i] == 'X') {
                legendColor = '#448ee4';
            } else {
                legendColor = '#dc2b28';
            }

            document.getElementById("addColor").innerHTML +=
                '<span class="w24 h24" style="opacity:0.4;background-color:' + legendColor + '"></span>';

            document.getElementById("addLabel").innerHTML += '<p id="label">' + legendContent[i] + '</p>';
        }
    }

    //when an address is entered and you hit enter or the button,
    //geocode the address and call findNewLocation() with the latlng
    function geocodeAddress(address) {

        L.esri.Geocoding.geocode().text(address).run(function (err, results) {

            searchLatLng = L.latLng(results.results["0"].latlng.lat, results.results["0"].latlng.lng);
            findNewLocation(searchLatLng);
        });
    }

    function updateOnMove() {

        currentLocation.remove();

        if (radiusLocation) {
            radiusLocation.remove();
        }

        var center = map.getCenter();
        radiusLocation = L.circle(center, {
            radius: 5000,
            opacity: 0,
            fillOpacity: 0
        });
        radiusLocation.addTo(map);
        queryFloodMap(radiusLocation.getBounds());
    }

    function findNewLocation(latLng) {

        //remove the current marker
        currentLocation.remove();
        radiusLocation.remove();

        //add a new marker at the new location
        currentLocation = L.marker(searchLatLng).addTo(map);
        map.setView(latLng, 15);

        //get new bounds and center
        bounds = map.getBounds();
        center = map.getCenter();
        //new query with new bounds
        queryFloodMap(bounds);
    }

    //use point in polygon to find out what flood zone the marker is in
    //and give it a popup
  /*  function createLocationPopup(floodLayer) {

        var results = leafletPip.pointInLayer(currentLocation.getLatLng(), floodLayer);
        //console.log(results);
        if (results.length != 0) {
            currentLocation.bindPopup("The marker falls in flood zone " + results["0"].feature.properties.FLD_ZONE).openPopup();
        } else {
            currentLocation.bindPopup("This marker falls outside of the 100-year and 500-year flood zone").openPopup();
        }
    } */

    function retrieveInfo(floodLayerGroup) {

        var info = $('#info');

        floodLayerGroup.eachLayer(function (layer) {

            layer.on('mouseover', function (e) {

                info.removeClass('none').show();
                var props = e.layer.feature.properties["FLD_ZONE"];

                $('#info span').html(props);

                e.layer.setStyle({
                    fill: 'yellow'
                });
            });

            layer.on('mouseout', function (e) {

                var props = e.layer.feature.properties["FLD_ZONE"];
                info.hide();

                if (props != 'X') {

                    e.layer.setStyle({
                        fill: '#dc2b28'
                    });
                } else {
                    e.layer.setStyle({
                        fill: '#448ee4'
                    });
                }
            });

        });

        $(document).mousemove(function (e) {
            // first offset from the mouse position of the info window
            info.css({
                "left": e.pageX + 6,
                "top": e.pageY - info.height() - 25
            });

            // if it crashes into the top, flip it lower right
            if (info.offset().top < 4) {
                info.css({
                    "top": e.pageY + 15
                });
            }
            // if it crashes into the right, flip it to the left
            if (info.offset().left + info.width() >= $(document).width() - 40) {
                info.css({
                    "left": e.pageX - info.width() - 80
                });
            }
        });

    }

})();