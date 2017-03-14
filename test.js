(function () {

    var map = L.map('map', {
        zoomSnap: .1,
        center: [42.9699, -71.0224],
        zoom: 14
            //minZoom: 13

    });

    var searchAddress = "",
        searchLatLng,
        //bounds = L.latLngBounds(map.getBounds()),
        bounds = map.getBounds(),
        center = map.getCenter(),
        boundsZoom = map.getBoundsZoom(bounds),
        floodLayer;

    console.log(bounds);

    var tiles = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
            .run(function (error, featureCollection, response) {

                makeMap(featureCollection);
            })
    }

    function makeMap(data) {

        floodLayer = L.geoJson(data, {
            style: function (feature) {
                return {
                    color: 'red',
                    weight: 1
                };
            }
        }).addTo(map);
    }

    function geocodeAddress(address) {

        L.esri.Geocoding.geocode().text(address).run(function (err, results) {

            //bounds = results.results["0"].bounds;
            searchLatLng = L.latLng(results.results["0"].latlng.lat, results.results["0"].latlng.lng);
            //    L.marker(searchLatLng).addTo(map);
            //console.log(results);
            //console.log(bounds);
            // map.fitBounds(bounds);
            //  queryFloodMap(bounds);

            findNewLocation(searchLatLng);

        });
    }

    function findNewLocation(latLng) {

        //floodLayer.remove();

        L.marker(searchLatLng).addTo(map);
        map.setView(latLng, 13, {
            animate: true,
        });
        
        map.on('moveend', function() {
            bounds = map.getBounds();
            center = map.getCenter();
            queryFloodMap(bounds);
        })
        
    }
    /*var popupTemplate = "<h3>Flood Zone: {FLD_ZONE}</h3><br><h4>100 year? {SFHA_TF}";

      floods.bindPopup(function (e) {
          return L.Util.template(popupTemplate, e.feature.properties)
      });
      
      */


})();