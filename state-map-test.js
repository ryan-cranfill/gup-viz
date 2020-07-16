let states, map, slider, output, geoData, currentTime, times = [], requests = {}, maxVals = {}, legend, info

let grades = [0, 10, 20, 50, 100, 200, 500, 1000]

const colorScale = chroma.scale(['yellow', '008ae5'])

function getStatesGeojson () {
  axios.get('https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json')
       .then(response => {
         states = response.data
         addStatesToMap()
         setUpLegend()
         console.log(states)
         setUpSlider()
         setUpInfoPane()
       })
}

function refreshMap () {
  map.removeLayer(geoData)
  addStatesToMap()
}

function setUpSlider () {
  slider = document.getElementById("timeRange");
  output = document.getElementById("timeDisplay");
  output.innerHTML = times[slider.value] // Display the default slider value
  slider.max = times.length - 1
  currentTime = times[slider.value]
  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function() {
    currentTime = times[this.value]
    output.innerHTML = currentTime
    doGrades()
    refreshMap()
  }
  doGrades()
  refreshMap()
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
           const numRequests = row.num_requests
           if (!requests[state])
             requests[state] = {}

           if (!maxVals[time] || maxVals[time] < numRequests)
             maxVals[time] = numRequests

           requests[row.stateprovince][time] = numRequests
           times.push(row.week)
         }
         // blech, must be a better way than this
         times = new Set(times)
         times = Array.from(times).sort();
         getStatesGeojson()

         console.log(maxVals)
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
  geoData = L.geoJson(states, {
    style: style,
    onEachFeature: onEachFeature
  })
  geoData.addTo(map)
}

function getColor(d, max=1000) {
  if (!d)
    return 'aqua'
  return colorScale(d / max)
    // return d > 1000 ? '#800026' :
    //        d > 500  ? '#BD0026' :
    //        d > 200  ? '#E31A1C' :
    //        d > 100  ? '#FC4E2A' :
    //        d > 50   ? '#FD8D3C' :
    //        d > 20   ? '#FEB24C' :
    //        d > 10   ? '#FED976' :
    //                   '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(requests[feature.id][currentTime], maxVals[currentTime]),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function doGrades (numSteps= 5) {
  grades = []
  const currentVal = maxVals[currentTime]
  const stepSize = Math.round(currentVal / numSteps)

  for (let i of _.range(0, numSteps + 1)) {
    grades.push(i * stepSize)
  }
  setUpLegend()
}

function setUpLegend () {
  if (legend)
    map.removeControl(legend)
  legend = L.control({position: 'bottomright'});

  legend.onAdd = function (map) {
      let div = L.DomUtil.create('div', 'info legend')

      div.innerHTML += '<i style="background: aqua"></i> No Requests <br>'

      // loop through our intervals and generate a label with a colored square for each interval
      for (let i = 0; i < grades.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(grades[i] + 1, maxVals[currentTime]) + '"></i> ' +
              grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
  };

  legend.addTo(map);
}

function highlightFeature(e) {
    let layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    info.update(layer.feature);
}

function resetHighlight(e) {
    geoData.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

function setUpInfoPane () {
  info = L.control();

  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
      this.update();
      return this._div;
  };

  // method that we will use to update the control based on feature properties passed
  info.update = function (feature) {
    let insert
    if (feature) {
      const props = feature.properties
      const numRequests = requests[feature.id][currentTime]
      const numRequestsStr = numRequests ? numRequests.toString() : 'no'
      insert = '<b>' + props.name + '</b> ' + numRequestsStr + ' requests'
    } else {
      insert = 'Hover over a state'
    }
    this._div.innerHTML = '<h4>Requests Count:</h4>' + insert
  }

  info.addTo(map);
}


setUpMap()
