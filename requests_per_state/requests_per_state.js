let states, map, geoData, requests = {}, max, legend, info

let grades = []

const colorScale = chroma.scale(chroma.brewer.GnBu)
const notFoundColor = '#726d6d'

function getStatesGeojson () {
  axios.get('https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json')
       .then(response => {
         states = response.data
         addStatesToMap()
         setUpLegend()
         console.log(states)
         setUpInfoPane()
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
         requests[state] +=  row.num_requests
       }
       max = Math.max(...Object.values(requests))
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
  geoData = L.geoJson(states, {
    style: style,
    onEachFeature: onEachFeature
  })
  geoData.addTo(map)
}

function getColor(d) {
  if (!d)
    return notFoundColor
  return colorScale(d / max)
}

function doGrades (numSteps= 5) {
  grades = []
  const stepSize = Math.round(max / numSteps)

  for (let i of _.range(0, numSteps + 1)) {
    grades.push(i * stepSize)
  }
}

function style(feature) {
    return {
        fillColor: getColor(requests[feature.id]),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function setUpLegend () {
  doGrades()
  if (legend)
    map.removeControl(legend)
  legend = L.control({position: 'bottomright'});

  legend.onAdd = function (map) {
      let div = L.DomUtil.create('div', 'info legend')

      div.innerHTML += `<i style="background: ${notFoundColor}"></i> No Requests <br>`

      // loop through our intervals and generate a label with a colored square for each interval
      for (let i = 0; i < grades.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
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
      const numRequests = requests[feature.id]
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
