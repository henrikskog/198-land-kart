const TOTAL_COUNTRY_GEOJSON_SIZE = 12430424;

const getCountryTranslations = async () => {
  const response = await fetch("country_translations.json");
  const data = await response.json();
  return data;
};

const getCountryCoords = async () => {
  // https://github.com/gavinr/world-countries-centroids/releases
  const response = await fetch("country_general_data.json");
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

async function getEpisodesSortedByDate() {
  const response = await fetch("episodes_by_date.json");
  const data = await response.json();
  return data;
}

function createCountryPopupText(countryName, ISO_A3, episodeData) {
  let text = `<b>${countryName}</b>\n`;
  const episodes = episodeData[ISO_A3];

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

async function openRandomCountryOnLoad(map, episodeData, countryCoords) {
  const countries = Object.keys(episodeData);
  const randomCountry = countries[Math.floor(Math.random() * countries.length)];

  const popupText = createCountryPopupText(
    countryName,
    randomCountry,
    episodeData
  );

  const countryCoordinates = L.latLng(
    countryCoords[randomCountry].lat,
    countryCoords[randomCountry].lon
  );

  L.popup().setLatLng(countryCoordinates).setContent(popupText).openOn(map);
}

async function fetchWithProgress(url, totalSize, onProgress) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body.getReader();
  let receivedLength = 0;

  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    const percentComplete = Math.round((receivedLength / totalSize) * 100);
    onProgress(percentComplete);
  }

  let chunksAll = new Uint8Array(receivedLength);
  let position = 0;
  for (let chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  return new Response(chunksAll, { headers: response.headers }).json();
}

const main = async () => {
  //   Fetching and parsing translations for country names from a JSON file.
  const countryData = await getCountryCoords();

  // Fetching GeoJSON data representing country shapes
  const geoJSONData = await fetchWithProgress(
    "country-geojson-data-compressed.json",
    TOTAL_COUNTRY_GEOJSON_SIZE,
    (percentComplete) => {
      if (percentComplete > 0 && percentComplete <= 100) {
        updateProgress(percentComplete);
      }
    }
  );

  // Fetching and parsing an "episodes by country" dataset from a local JSON file.
  const episodeData = await getEpisodes();

  const countryTranslations = await getCountryTranslations();

  // Setting up a Leaflet map, which is a JavaScript library for interactive maps.
  const map = L.map("map", {
    center: [62, 15],
    zoom: 3,
  });

  fillCountryList(
    countryData,
    episodeData,
    map,
    document.getElementById("countryList")
  );

  const episodesByDate = () => {
    const episodes = [];
    Object.values(episodeData).forEach((value) => {
      value.forEach((entry) => {
        episodes.push(entry);
      });
    });

    episodes.sort((a, b) => {
      return new Date(b.ep.release_date) - new Date(a.ep.release_date);
    });
    return episodes.reverse();
  };

  fillEpisodeList(episodesByDate(), document.getElementById("episodeList"));

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
      const countryPopupText = createCountryPopupText(
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
  runOnFirstVisit(async () => {
    openRandomCountryOnLoad(map, episodeData, countryData);
  });

  bindButtonToElementDisplay(
    document.getElementById("listBtn1"),
    document.getElementById("countryList"),
    document.getElementById("episodeList")
  );

  bindButtonToElementDisplay(
    document.getElementById("listBtn2"),
    document.getElementById("episodeList"),
    document.getElementById("countryList")
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
    console.log("Asynchronous error", error);
    handleError(
      "🤒 Her har det skjedd noe feil! Prøv å laste inn siden på nytt eller kom tilbake senere."
    );
  });
} catch (error) {
  console.log("Synchronous error", error);
  handleError(
    "🤒 Her har det skjedd noe feil! Prøv å laste inn siden på nytt eller kom tilbake senere."
  );
}

function updateProgress(number) {
  // Get the progress bar and spinner
  const progressBarContainer = document.querySelector(
    ".progress-bar-container"
  );
  const progressBar = document.getElementById("loader");
  const mapContainer = document.getElementById("mapContainer");

  // Update the progress bar
  progressBar.value = number;

  // Show or hide the spinner
  if (number < 100) {
    progressBarContainer.style.display = "block";
  } else {
    progressBarContainer.style.display = "none";
    mapContainer.style.display = "block";
  }
}

const bindButtonToElementDisplay = (buttonEl, containerEl, otherContainerEl) => {
  console.log(containerEl);
  buttonEl.addEventListener("click", () => {
    const disp = window.getComputedStyle(containerEl).display;
    if (disp == "none") {
      containerEl.style.display = "flex";
      otherContainerEl.style.display = "none";
    } else {
      containerEl.style.display = "none";
    }
  });
};

const fillCountryList = (countryData, episodeData, map, containerElement) => {
  // Create a list of countries with norwegian names
  const c = [
    "Europa",
    "Asia",
    "Afrika",
    "Oseania",
    "Sør-Amerika",
    "Nord-Amerika",
  ];

  // calculate number of countries covered in each continent
  const continents = {};
  c.forEach((a) => {
    continents[a] = {
      covered: 0,
      total: 0,
    };
  });

  Object.values(countryData).forEach((value) => {
    const continent = value["continent_no"];

    if (continent) {
      const isoa3 = value["ISO_A3"];

      if (episodeData[isoa3] != undefined) {
        continents[continent]["covered"] += 1;
      }

      continents[continent]["total"] += 1;
    }
  });

  Object.entries(continents).forEach(([continentName, continent]) => {
    const header = document.createElement("h3");
    header.innerHTML = continentName;

    const ul = document.createElement("ul");
    ul.id = continentName.toLowerCase();

    const subHeader = document.createElement("p");
    subHeader.classList.add("continentListSubHeader");
    subHeader.innerHTML = continent["covered"] + "/" + continent["total"];

    containerElement.appendChild(header);
    containerElement.appendChild(subHeader);
    containerElement.appendChild(ul);
  });

  const orderedOnCovered = Object.keys(countryData).sort((a, b) => {
    // if episode is in episodeData (country[key]['ISO_A3'] in episodeData), sort it to the top

    const aInEpisodes = Object.keys(episodeData).includes(
      countryData[a]["ISO_A3"]
    );

    const bInEpisodes = Object.keys(episodeData).includes(
      countryData[b]["ISO_A3"]
    );

    if (aInEpisodes && !bInEpisodes) {
      return -1;
    } else if (!aInEpisodes && bInEpisodes) {
      return 1;
    } else {
      return 0;
    }
  });

  // Loop through the countrytranslations
  orderedOnCovered.forEach((key) => {
    const value = countryData[key];
    // find the continent
    const continent = value["continent_no"];

    if (!continent) {
      console.log("not writing country ", value["name"]);
    } else {
      const ul = document.getElementById(continent.toLowerCase());

      // Create a list item for each country
      const li = document.createElement("li");
      ul.appendChild(li);
      li.innerHTML = value["name_no"];

      // if in episodeData, add a class

      const doneEpisodes = Object.keys(episodeData);

      if (doneEpisodes.includes(value["ISO_A3"])) {
        console.log("yes");
        li.classList.add("episodeItem");
        li.addEventListener("click", () =>
          onListItemClick(value, map, episodeData)
        );
      } else {
        li.classList.add("noEpisodeItem");
      }
    }
  });
};

const fillEpisodeList = (episodeData, containerElement) => {
  const div = document.createElement("div");
  containerElement.appendChild(div);

  Object.values(episodeData)
    .reverse()
    .forEach((value) => {
      const div = document.createElement("div");
      containerElement.appendChild(div);

      const date = new Date(value.ep.release_date);
      const title = value.ep.name;
      const country = value.country;
      const episodeString = `<h3>${title}</h3>
<p>${title}</p>
<p>${date.getDate()}.${date.getMonth()}.${date.getFullYear()}</p>
<p>${country}</p>`;

      // const trimmed = value.ep.name.trim();
      div.innerHTML = episodeString;
    });
};

const onListItemClick = (countryName, map, episodeData) => {
  const listModal = document.getElementById("countryList");
  listModal.style.display = "none";

  // remove blur from #map element
  const mapEl = document.getElementById("map");
  mapEl.classList.remove("blur");

  const coords = [countryName.lat, countryName.lon];

  map.setView(coords, 3);

  const popupContent = createCountryPopupText(
    countryName.name_no,
    countryName.ISO_A3,
    episodeData
  );

  L.popup().setLatLng(coords).setContent(popupContent).openOn(map);
};
