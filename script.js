const getGeoJsonData = async () => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch GeoJSON data:", error);
  }
};

async function getEpisodes() {
  const url =
    "https://skog-95556456.azurewebsites.net/api/hello?code=N47ZHVkIIEpAN9CffLR8nc2BMT5NHK8p7m-9GbV3wm6_AzFuLAjOiw==";
  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      return data;
    });
}

// Create a tile layer using the CartoDB Positron (No Labels) tile server
const noLabelsTileLayer = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    attribution: "© OpenStreetMap contributors, © CARTO",
    maxZoom: 19,
  }
);

function setTileLayer(map) {
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
}

async function main() {
  const map = L.map("map").setView([62, 15], 4);

  noLabelsTileLayer.addTo(map);

  const data = await getEpisodes();

  const onEachFeature = (feature, layer) => {
    // Add a click event listener to the layer (country polygon)
    const entries = data[feature.properties.ISO_A3];

    let toolTip = `<b>${feature.properties.ADMIN}</b>\n`;

    if (entries) {
      entries.forEach((entry) => {
        const trimmed = entry.ep.name.trim();
        toolTip += "\n";
        toolTip += `<a target="_blank" href="${entry.ep.external_urls.spotify}">${trimmed}</a>`;
      });
    }

    layer.on("click", (e) => {
        L.popup()
        .setLatLng(e.latlng) // Set the position of the popup based on the click event
        .setContent(toolTip)
        .openOn(layer._map); // Open the popup on the map
    });
  };

  const styleCountry = (country) => {
    const countryCode = country.properties.ISO_A3;

    if (Object.keys(data).includes(countryCode)) {
      console.log("BLUE", country, countryCode);
      return { fillColor: "#ff7800", fillOpacity: 0.5, weight: 1 };
    }
    return { fillColor: "transparent", fillOpacity: 0.5, weight: 1 };
  };

  const geoJsonData = await getGeoJsonData();
  L.geoJSON(geoJsonData, {
    onEachFeature: onEachFeature,
    style: styleCountry,
  }).addTo(map);
}
main();
