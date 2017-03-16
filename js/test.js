(function () {

    var map = L.map('map', {
        zoomSnap: .1,
        center: [37.5328, -77.4318],
        zoom: 14
            //minZoom: 13

    });

    /*  var map = L.map('map', {
 L.mapbox.accessToken = 'pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ';
    var map = L.mapbox.map('map', 'mapbox.streets').setView([37.6043, -77.3614], 14); */


    var searchAddress = "",
        searchLatLng,
        //bounds = L.latLngBounds(map.getBounds()),
        bounds = map.getBounds(),
        center = map.getCenter(),
        boundsZoom = map.getBoundsZoom(bounds),
        floodLayer,
        floodLayerGroup = L.layerGroup(),
        Qjson;

    //console.log(bounds);

    var tiles = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var service = L.esri.featureLayerService({
        url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28'
    });

    queryFloodMap(bounds);


    $('.input').bind("enterKey", function (e) {
        searchAddress = $('.input').val();
        //console.log(searchAddress);
        geocodeAddress(searchAddress);
    });

    $('.btn').on('click', function (e) {
        searchAddress = $('.input').val();
        //console.log(searchAddress);
        geocodeAddress(searchAddress);
    })

    $('.input').keyup(function (e) {
        if (e.keyCode == 13) {
            $(this).trigger("enterKey");
        }
    });

    function queryFloodMap(bounds) {

        service.query()
            .within(bounds)
            .fields(['OBJECTID', 'DFIRM_ID', 'FLD_ZONE', 'SFHA_TF'])
            .precision(4)
            .simplify(map, 0.30)
            .run(function (error, featureCollection, response) {

                //console.log(typeof(featureCollection.features));
                //console.log(featureCollection);
                makeMap(featureCollection);
                createLegend(featureCollection);

            })
    }

    function makeMap(data) {

        floodLayer = L.geoJson(data, {
            style: function (feature) {

                if (feature.properties["FLD_ZONE"] == 'X') {
                    return {
                        color: 'blue',
                        weight: 1
                    }
                } else if (feature.properties["FLD_ZONE"] == 'AE' || feature.properties["FLD_ZONE"] == 'A') {
                    return {

                        color: 'red',
                        weight: 1
                    }
                }
            }
        }).addTo(floodLayerGroup);
        
        //console.log(typeof(floodLayer));

        var popupTemplate = "<h3>Flood Zone: {FLD_ZONE}</h3><br><h4>100 year? {SFHA_TF}";

        floodLayer.bindPopup(function (e) {
            return L.Util.template(popupTemplate, e.feature.properties)
        });

        floodLayerGroup.addTo(map);
    }

    function createLegend(data) {

        var legColor = '#00f';

        Qjson = jsonQ(data);
        var allZones = Qjson.find('FLD_ZONE');
        var legendContent = allZones.unique();
        //console.log(allZones.unique());

        for (var i = 0; i < legendContent.length; i++) {

            document.getElementById("addColor").innerHTML +=
                '<span class="w24 h24" style="background:' + legColor + '"></span>';

            document.getElementById("addLabel").innerHTML += '<p id="label">' + legendContent[i] + '</p>';
        }
    }

    function geocodeAddress(address) {

        L.esri.Geocoding.geocode().text(address).run(function (err, results) {

            searchLatLng = L.latLng(results.results["0"].latlng.lat, results.results["0"].latlng.lng);
            //console.log(results);
            //console.log(bounds);


            findNewLocation(searchLatLng);

        });
    }

    function findNewLocation(latLng) {

        L.marker(searchLatLng).addTo(map);
        map.setView(latLng, 13);


        floodLayerGroup.clearLayers();
        bounds = map.getBounds();
        center = map.getCenter();
        queryFloodMap(bounds);

        console.log(bounds)

    }

})();