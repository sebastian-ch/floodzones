mapboxgl.accessToken = 'pk.eyJ1Ijoic2ViYXN0aWFuLWNoIiwiYSI6ImNpejkxdzZ5YzAxa2gyd21udGpmaGU0dTgifQ.IrEd_tvrl6MuypVNUGU5SQ';


var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/basic-v9',
    center: [-77.4332, 37.5347],
    zoom: 12
});

var service = L.esri.featureLayerService({
    url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28'
});


var currentBounds = map.getBounds();
console.log(currentBounds);
var ne = currentBounds._ne;
var sw = currentBounds._sw;
var queryBounds = L.latLngBounds(ne, sw);

var serviceNew = new L.esri.featureLayer({
    url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28',
    fields: ['OBJECTID', 'DFIRM_ID', 'FLD_ZONE', 'SFHA_TF'],
    simplifyFactor: 0.30,
    precision: 4

});


serviceNew.load(function (data) {

    makeMap(serviceNew);
});





/*queryMap(queryBounds);

function queryMap(bounds) {
    service.query()
        .within(bounds)
        .fields(['OBJECTID', 'DFIRM_ID', 'FLD_ZONE', 'SFHA_TF'])
        .precision(4)
        .run(function (error, featureCollection, response) {

            console.log(featureCollection);
            makeMap(featureCollection);

        });
}
 */
function makeMap(data) {

    map.addSource('data', {
        'type': 'geojson',
        'data': data
    });

    map.addLayer({
        'id': 'data',
        'type': 'fill',
        'source': 'data',
        'layout': {},
        'paint': {
            'fill-outline-color': '#111',
            'fill-opacity': 0.8,
            'fill-color': {
                property: 'FLD_ZONE',
                type: 'categorical',
                stops: [
                    ['AE', 'red'],
                    ['X', 'blue']]
            }
        }
    });

}