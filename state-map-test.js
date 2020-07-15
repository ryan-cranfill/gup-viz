let states, map, slider, output, geoData, currentTime, times = [], requests = {}


function getStatesGeojson () {
  axios.get('https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json')
       .then(response => {
         states = response.data
         addStatesToMap()
         console.log(states)
         setUpSlider()
       })
}

function setUpSlider () {
  slider = document.getElementById("timeRange");
  output = document.getElementById("timeDisplay");
  output.innerHTML = times[slider.value] // Display the default slider value
  slider.max = times.length - 1
  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function() {
    currentTime = times[this.value]
    output.innerHTML = currentTime
    map.removeLayer(geoData)
    addStatesToMap()
    console.log(map)
  }
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
           const time = row.week
           if (!requests[state])
             requests[state] = {}
           requests[row.stateprovince][time] =  row.num_requests
           times.push(row.week)
         }
         // blech, must be a better way than this
         times = new Set(times)
         times = Array.from(times).sort();
         getStatesGeojson()
       })
}

function setUpMap () {
  map = L.map('map').setView([37.8, -96], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  getStatesRequests()
}

function addStatesToMap() {
  geoData = L.geoJson(states, {style: style})
  geoData.addTo(map)
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
        fillColor: getColor(requests[feature.id][currentTime]),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

setUpMap()
