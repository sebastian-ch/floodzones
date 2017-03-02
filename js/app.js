(function () {

    var map = L.map('map', {
        zoomSnap: .1,
        center: [42.9699, -71.0224],
        zoom: 14,
        minZoom: 13

    });

    /* map.setMaxBounds(map.getBounds(), {
         padding: [50, 50]
     }); */

    var tiles = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);


    var floods = L.esri.featureLayer({
        url: "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28",
        where: "SFHA_TF = 'T'",
        fields: ['OBJECTID', 'SFHA_TF', 'FLD_ZONE', ],
        simplifyFactor: 0.35,
        precision: 5,
        style: function (feature) {
            if (feature.properties.FLD_ZONE === 'AE') {

                return {
                    color: '#ff0000',
                    weight: 2
                };
            } else if (feature.properties.FLD_ZONE === 'X') {

                return {
                    color: '#000ff',
                    weight: 2
                };
            } else {
                return {
                    color: '#228B22',
                    weight: 2
                }
            }

        }
    }); //.addTo(map);

    addSearch();


    function addSearch() {

        var searchControl = L.esri.Geocoding.geosearch();
        searchControl.onAdd = function (map) {

            var div = L.DomUtil.get("search");
            
            return div;
        }

        searchControl.addTo(map);
        var results = L.layerGroup().addTo(map);
        
        searchControl.on("results", function(data){
            
            results.clearLayers();
            for (var i = data.results.length - 1; i >= 0; i--) {
                
                results.addLayer(L.marker(data.results[i].latlng));
            }
        });

    }

    /* var popupTemplate = "<h3>Flood Zone: {FLD_ZONE}</h3><br><h4>100 year? {SFHA_TF}";

     floods.bindPopup(function (e) {
         return L.Util.template(popupTemplate, e.feature.properties)
     }); */


    /*   function drawMap(zones) {

           var floods = L.geoJSON(zones, {

               style: function () {
                   return {
                       color: '#ff0000',
                       weight: 1
                   }
               }
           }).addTo(map);

       } */


    /*   function drawLegend() {

           var legend = L.control({
               positon: 'bottomright'
           });

           legend.onAdd = function (map) {

               var div = L.DomUtil.get("legend");

               L.DomEvent.disableScrollPropagation(div);
               L.DomEvent.disableClickPropagation(div);

               return div;
           }

           legend.addTo(map);

       } */

})();