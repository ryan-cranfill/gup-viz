let states, map, requests = {}

function getStatesGeojson () {
  axios.get('https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json')
       .then(response => {
         states = response.data
         addStatesToMap()
         console.log(states)
       })
}

function getStatesRequests () {
  // Redash URL - currently inoperative so using github for now
  // const jsonUrl = 'https://app.redash.io/getusppe/api/queries/413863/results.json?api_key=wVxS1zUpR1H1hhEKDMm2GbfEf0tbbUoIBonXDOKc'
  const jsonUrl = 'https://raw.githubusercontent.com/ryan-cranfill/gup-viz/master/data/state_requests_per_week_latest.json'

  axios.get(jsonUrl)
       .then(response => {
         const data = response.data.query_result.data
         const rows = data.rows
         for (row of rows) {
           const state = row.stateprovince
           if (!requests[state])
             requests[state] = 0
           requests[row.stateprovince] +=  row.num_requests
         }
         console.log(rows)
         console.log(requests)
       })
}

function setUpMap () {
  map = L.map('map').setView([37.8, -96], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function addStatesToMap() {
  L.geoJson(states, {style: style}).addTo(map)
}

function getColor(d) {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
}

function style(feature) {
    return {
        // fillColor: getColor(feature.properties.density),
        fillColor: getColor(requests[feature.id]),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

setUpMap()
getStatesRequests()
getStatesGeojson()
