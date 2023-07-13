const getCountryTranslations = async () => {
  const response = await fetch("country_translations.json");
  const data = await response.json();
  return data;
};

const getGeoJsonData = async () => {
  const response = await fetch("country-geojson-data.json");
  const data = await response.json();
  return data;
};

async function getEpisodes() {
  const response = await fetch("episodes_by_country.json");
  const data = await response.json();
  return data;
}

function createCountryPopup(countryName, cc, episodeData) {
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
}

const runOnFirstVisit = (callback) => {
  const hasVisited = localStorage.getItem("hasVisited");
  if (!hasVisited) {
    localStorage.setItem("hasVisited", true);
    callback();
  }
};

async function openRandomCountryOnLoad(
  map,
  geoJSONData,
  countryTranslations,
  episodeData
) {
  const countries = Object.keys(episodeData);
  const randomCountry = countries[Math.floor(Math.random() * countries.length)];

  const episodes = episodeData[randomCountry];

  const countryName =
    countryTranslations[episodes[0].country] || episodes[0].country;
  const popupText = createCountryPopup(countryName, randomCountry, episodeData);

  const countryFeature = geoJSONData.features.find(
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

const main = async () => {
  //   Fetching and parsing translations for country names from a JSON file.

  const countryTranslations = await getCountryTranslations();

  // Fetching GeoJSON data representing country shapes from a remote source.
  const geoJSONData = await getGeoJsonData();

  // Fetching and parsing an "episodes by country" dataset from a local JSON file.
  const episodeData = await getEpisodes();

  // Setting up a Leaflet map, which is a JavaScript library for interactive maps.
  const map = L.map("map", {
    center: [62, 15],
    zoom: 3,
  });

  // Attaching a tile layer to the map from OpenStreetMap, which provides the base map tiles.
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Styling and adding GeoJSON features (countries) to the map. If a country has associated episodes from the dataset, its style is different.
  L.geoJSON(geoJSONData, {
    onEachFeature: (feature, layer) => {
      const name =
        countryTranslations[feature.properties.ADMIN] ||
        feature.properties.ADMIN;
      const countryPopupText = createCountryPopup(
        name,
        feature.properties.ISO_A3,
        episodeData
      );

      // For each country on the map, attaching a click event listener that opens a popup with information about the country and a list of episode links.
      layer.on("click", (e) => {
        L.popup()
          .setLatLng(e.latlng)
          .setContent(countryPopupText)
          .openOn(layer._map);
      });
    },
    style: (country) => {
      const countryCode = country.properties.ISO_A3;

      if (Object.keys(episodeData).includes(countryCode)) {
        return { fillColor: "#4CAF50", fillOpacity: 0.5, weight: 1 };
      }
      return { fillColor: "transparent", fillOpacity: 0.5, weight: 1 };
    },
  }).addTo(map);

  // On load, randomly selecting a country from the dataset and opening a popup with its information.
  runOnFirstVisit(() =>
    openRandomCountryOnLoad(map, geoJSONData, countryTranslations, episodeData)
  );
};

// Error handling function
const handleError = (errorMessage) => {
  document.body.innerHTML = `
      <div style="
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 100%; 
          background: rgba(0, 0, 0, 0.5);
          display: flex; 
          justify-content: center; 
          align-items: center; 
          color: white; 
          font-size: 2em;
          text-align: center;">
          <p style="max-width: 40ch; text-align: left;">${errorMessage}</p>
      </div>`;
};

try {
  main().catch((error) => {
    console.log("Asynchronous error");
    handleError(
      "UPS! Her skjedde det noe feil. :( Prøv å laste inn siden på nytt eller kom tilbake senere."
    );
  });
} catch (error) {
  console.log("Synchronous error");
  handleError(
    "UPS! Her skjedde det noe feil. :( Prøv å laste inn siden på nytt eller kom tilbake senere."
  );
}
