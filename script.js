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
  // Read json file from local file system
  const response = await fetch("episodes_by_country.json");
  return response.json();
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
  const map = L.map("map", {
    center: [62, 15],
    zoom: 2,
    maxBounds: [
      [-90, -180], // South-west corner (latitude, longitude)
      [90, 180], // North-east corner (latitude, longitude)
    ],
  });

  noLabelsTileLayer.addTo(map);

  const episodeData = await getEpisodes();

  const createCountryPopup = (countryName, cc) => {
    let text = `<b>${countryName}</b>\n`;

    const episodes = episodeData[cc];

    if (episodes) {
      episodes.forEach((entry) => {
        const trimmed = entry.ep.name.trim();
        text += "\n";
        text += `<a target="_blank" href="${entry.ep.external_urls.spotify}">${trimmed}</a>`;
      });
    }

    return text;
  };

  const onEachFeature = (feature, layer) => {
    const countryPopupText = createCountryPopup(
      feature.properties.ADMIN,
      feature.properties.ISO_A3
    );

    layer.on("click", (e) => {
      L.popup()
        .setLatLng(e.latlng) // Set the position of the popup based on the click event
        .setContent(countryPopupText)
        .openOn(layer._map); // Open the popup on the map
    });
  };

  const styleCountry = (country) => {
    const countryCode = country.properties.ISO_A3;

    if (Object.keys(episodeData).includes(countryCode)) {
      return { fillColor: "#4CAF50", fillOpacity: 0.5, weight: 1 };
    }
    return { fillColor: "transparent", fillOpacity: 0.5, weight: 1 };
  };

  const openRandomCountryOnLoad = () => {
    const countries = Object.keys(episodeData);
    let randomCountry = countries[Math.floor(Math.random() * countries.length)];

    const episodes = episodeData[randomCountry];

    const popupText = createCountryPopup(episodes[0].country, randomCountry);

    // Get the country's GeoJSON feature
    const countryFeature = geoJsonData.features.find(
      (feature) => feature.properties.ISO_A3 === randomCountry
    );

    if (countryFeature) {
      // Get the country's centroid coordinates
      let countryCoordinates = L.geoJSON(countryFeature)
        .getBounds()
        .getCenter();

      if (randomCountry == "NOR") {
        countryCoordinates = L.latLng(64.5, 13.5);
      }

      // Display the popup at the country's coordinates
      L.popup().setLatLng(countryCoordinates).setContent(popupText).openOn(map);
    }
  };

  const geoJsonData = await getGeoJsonData();
  L.geoJSON(geoJsonData, {
    onEachFeature: onEachFeature,
    style: styleCountry,
  }).addTo(map);

  openRandomCountryOnLoad();
}

main();
