(function () {
    // Provide your access token
    L.mapbox.accessToken = 'pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkyazUzeTAwdXUyd3FvdDc2OHVxZTYifQ.a4zHr0JWgO-XqYs-AUPA0w';
    // Create a map in the div #map
    var map = L.mapbox.map('map', 'mapbox.light', {

        zoomSnap: .1,
        center: [42.9699, -71.0224],
        zoom: 14,
        minZoom: 13

    });

    map.setMaxBounds(map.getBounds(), {
        padding: [50, 50]
    });

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

     var floods = L.esri.featureLayer({
         url: "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28",
         where: "SFHA_TF = 'T'",
         style: function () {
             return {
                 color: '#ff0000',
                 weight: 2
             };
         }
     }).addTo(map);

     var popupTemplate = "<h3>DFIRM ID: {DFIRM_ID}</h3><br><h4>100 year? {SFHA_TF}";

     floods.bindPopup(function (e) {
         return L.Util.template(popupTemplate, e.feature.properties)
     });

})();