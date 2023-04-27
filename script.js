const getCountryTranslations = async () => {
  const countryTranslations = await fetch("country_translations.json");
  return countryTranslations.json();
};

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

function setTileLayer(map) {
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
}

function createMap() {
  const map = L.map("map", {
    center: [62, 15],
    zoom: 2,
    maxBounds: [
      [-90, -180], // South-west corner (latitude, longitude)
      [90, 180], // North-east corner (latitude, longitude)
    ],
  });

  setTileLayer(map);
  return map;
}

function onEachFeature(feature, layer) {
  const name =
    COUNTRY_TRANSLATIONS[feature.properties.ADMIN] || feature.properties.ADMIN;
  const countryPopupText = createCountryPopup(name, feature.properties.ISO_A3);

  layer.on("click", (e) => {
    L.popup()
      .setLatLng(e.latlng)
      .setContent(countryPopupText)
      .openOn(layer._map);
  });
}

function createCountryPopup(countryName, cc) {
  let text = `<b>${countryName}</b>\n`;
  const episodes = EPISODE_DATA[cc];

  if (episodes) {
    episodes.forEach((entry) => {
      const trimmed = entry.ep.name.trim();
      text += "\n";
      text += `<a target="_blank" href="${entry.ep.external_urls.spotify}">${trimmed}</a>`;
    });
  }

  return text;
}

function styleCountry(country) {
  const countryCode = country.properties.ISO_A3;

  if (Object.keys(EPISODE_DATA).includes(countryCode)) {
    return { fillColor: "#4CAF50", fillOpacity: 0.5, weight: 1 };
  }
  return { fillColor: "transparent", fillOpacity: 0.5, weight: 1 };
}

async function openRandomCountryOnLoad(map) {
  const countries = Object.keys(EPISODE_DATA);
  let randomCountry = countries[Math.floor(Math.random() * countries.length)];
  const episodes = EPISODE_DATA[randomCountry];
  const countryName =
    COUNTRY_TRANSLATIONS[episodes[0].country] || episodes[0].country;
  const popupText = createCountryPopup(countryName, randomCountry);

  const countryFeature = GEOJSONDATA.features.find(
    (feature) => feature.properties.ISO_A3 === randomCountry
  );

  if (countryFeature) {
    let countryCoordinates = L.geoJSON(countryFeature).getBounds().getCenter();

    if (randomCountry === "NOR") {
      countryCoordinates = L.latLng(64.5, 13.5);
    }

    L.popup().setLatLng(countryCoordinates).setContent(popupText).openOn(map);
  }
}
async function main() {
  await COUNTRY_TRANSLATIONS;
  await EPISODE_DATA;
  await GEOJSONDATA;
  const map = createMap();

  L.geoJSON(GEOJSONDATA, {
    onEachFeature: (feature, layer) => onEachFeature(feature, layer),
    style: (country) => styleCountry(country),
  }).addTo(map);

  openRandomCountryOnLoad(map);
}

// Declare global variables
let COUNTRY_TRANSLATIONS;
let GEOJSONDATA;
let EPISODE_DATA;

// IIFE to initialize global variables with promises
(async function () {
  COUNTRY_TRANSLATIONS = await getCountryTranslations();
  GEOJSONDATA = await getGeoJsonData();
  EPISODE_DATA = await getEpisodes();

  // Execute the main function
  main();
})();
