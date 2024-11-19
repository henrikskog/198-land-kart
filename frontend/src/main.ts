import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from './api';
import { ContinentStats, CountryData, SpotifyEpisode, EpisodeData } from './types';
import './styles.css';


function createCountryPopupText(
  countryName: string,
  ISO_A3: string,
  episodeData: EpisodeData
): string {
  let text = `<b>${countryName}</b>\n`;
  const episodes = episodeData[ISO_A3];

  if (episodes) {
    episodes.forEach((entry: SpotifyEpisode) => {
      const trimmed = entry.ep.name.trim();
      text += "\n";
      text += `<a target="_blank" href="${entry.ep.external_urls.spotify}">${trimmed}</a>`;
    });
  }

  return text;
}

const fillCountryList = (
  countryData: CountryData,
  episodeData: EpisodeData,
  map: L.Map,
  containerElement: HTMLElement
): void => {
  const continents = [
    "Europa",
    "Asia",
    "Afrika",
    "Oseania",
    "Sør-Amerika",
    "Nord-Amerika",
  ];

  // Calculate number of countries covered in each continent
  const continentStats: ContinentStats = {};
  continents.forEach((continent) => {
    continentStats[continent] = {
      covered: 0,
      total: 0,
    };
  });

  Object.values(countryData).forEach((value: CountryData[keyof CountryData]) => {
    const continent = value.continent_no;

    if (continent) {
      const isoa3 = value.ISO_A3;

      if (episodeData[isoa3] !== undefined) {
        continentStats[continent].covered += 1;
      }

      continentStats[continent].total += 1;
    }
  });

  Object.entries(continentStats).forEach(([continentName, stats]) => {
    const header = document.createElement("h3");
    header.innerHTML = continentName;

    const ul = document.createElement("ul");
    ul.id = continentName.toLowerCase();

    const subHeader = document.createElement("p");
    subHeader.classList.add("continentListSubHeader");
    subHeader.innerHTML = `${stats.covered}/${stats.total}`;

    containerElement.appendChild(header);
    containerElement.appendChild(subHeader);
    containerElement.appendChild(ul);
  });

  const orderedOnCovered = Object.keys(countryData).sort((a, b) => {
    const aInEpisodes = Object.keys(episodeData).includes(countryData[a].ISO_A3);
    const bInEpisodes = Object.keys(episodeData).includes(countryData[b].ISO_A3);

    if (aInEpisodes && !bInEpisodes) return -1;
    if (!aInEpisodes && bInEpisodes) return 1;
    return 0;
  });

  orderedOnCovered.forEach((key) => {
    const value = countryData[key];
    const continent = value.continent_no;

    if (!continent) {
      console.log("not writing country ", value.name);
      return;
    }

    const ul = document.getElementById(continent.toLowerCase());
    if (!ul) return;

    const li = document.createElement("li");
    ul.appendChild(li);
    li.innerHTML = value.name_no;

    if (Object.keys(episodeData).includes(value.ISO_A3)) {
      li.classList.add("episodeItem");
      li.addEventListener("click", () => onListItemClick(value, map, episodeData));
    } else {
      li.classList.add("noEpisodeItem");
    }
  });
};

const fillEpisodeList = (episodeData: SpotifyEpisode[], containerElement: HTMLElement): void => {
  episodeData.reverse().forEach((value) => {
    const div = document.createElement("div");
    containerElement.appendChild(div);

    const date = new Date(value.ep.release_date);
    const title = value.ep.name;
    const country = value.country;
    
    div.innerHTML = `
      <h3>${title}</h3>
      <p>${title}</p>
      <p>${date.getDate()}.${date.getMonth()}.${date.getFullYear()}</p>
      <p>${country}</p>
    `;
  });
};

const onListItemClick = (
  countryData: CountryData[keyof CountryData],
  map: L.Map,
  episodeData: EpisodeData
): void => {
  const listModal = document.getElementById("countryList");
  if (listModal) listModal.style.display = "none";

  const mapEl = document.getElementById("map");
  mapEl?.classList.remove("blur");

  const coords: [number, number] = [countryData.lat, countryData.lon];
  map.setView(coords, 3);

  const popupContent = createCountryPopupText(
    countryData.name_no,
    countryData.ISO_A3,
    episodeData
  );

  L.popup().setLatLng(coords).setContent(popupContent).openOn(map);
};

const runOnFirstVisit = (callback: () => void): void => {
  const hasVisited = localStorage.getItem("hasVisited");
  if (!hasVisited) {
    localStorage.setItem("hasVisited", "true");
    callback();
  }
};

async function openRandomCountryOnLoad(
  map: L.Map,
  episodeData: EpisodeData,
  countryCoords: CountryData
): Promise<void> {
  const countries = Object.keys(episodeData);
  const randomCountry = countries[Math.floor(Math.random() * countries.length)];
  const countryName = countryCoords[randomCountry].name_no;

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

function updateProgress(number: number): void {
  const progressBarContainer = document.querySelector<HTMLElement>(
    ".progress-bar-container"
  );
  const progressBar = document.getElementById("loader") as HTMLProgressElement;
  const mapContainer = document.getElementById("mapContainer") as HTMLElement;

  progressBar.value = number;

  if (number < 100) {
    progressBarContainer!.style.display = "block";
  } else {
    progressBarContainer!.style.display = "none";
    mapContainer.style.display = "block";
  }
}

const bindButtonToElementDisplay = (
  buttonEl: HTMLElement,
  containerEl: HTMLElement
): void => {
  buttonEl.addEventListener("click", () => {
    const disp = window.getComputedStyle(containerEl).display;
    containerEl.style.display = disp === "none" ? "flex" : "none";
  });
};

const main = async (): Promise<void> => {
  try {
    const countryData = await api.getCountryCoords();
    const geoJSONData = await api.fetchGeoJSONData(updateProgress);
    const episodeData = await api.getEpisodes();
    const countryTranslations = await api.getCountryTranslations();

    const map = L.map("map", {
      center: [62, 15],
      zoom: 3,
      minZoom: 2,
      maxBounds: L.latLngBounds([-90, -180], [90, 180]),
      maxBoundsViscosity: 1.0
    });

    const countryList = document.getElementById("countryList");
    const episodeList = document.getElementById("episodeList");

    if (countryList && episodeList) {
      fillCountryList(countryData, episodeData, map, countryList);

      const episodes = Object.values(episodeData).flatMap(value => value)
        .sort((a: SpotifyEpisode, b: SpotifyEpisode) => 
          new Date(b.ep.release_date).getTime() - new Date(a.ep.release_date).getTime()
        )
        .reverse();

      fillEpisodeList(episodes, episodeList);
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      tileSize: 256,
      zoomOffset: 0,
      detectRetina: true
    }).addTo(map);

    L.geoJSON(geoJSONData as any, {
      onEachFeature: (feature, layer) => {
        const name = countryTranslations[feature.properties.ADMIN] || feature.properties.ADMIN;
        const countryPopupText = createCountryPopupText(
          name,
          feature.properties.ISO_A3,
          episodeData
        );

        layer.on("click", (e) => {
          L.popup()
            .setLatLng(e.latlng)
            .setContent(countryPopupText)
            .openOn(map);
        });
      },
      style: (country: any) => {
        const countryCode = country?.properties?.ISO_A3;
        return Object.keys(episodeData).includes(countryCode)
          ? { fillColor: "#4CAF50", fillOpacity: 0.5, weight: 1 }
          : { fillColor: "transparent", fillOpacity: 0.5, weight: 1 };
      },
    }).addTo(map);

    runOnFirstVisit(() => {
      openRandomCountryOnLoad(map, episodeData, countryData);
    });

    const listBtn1 = document.getElementById("listBtn1");
    const listBtn2 = document.getElementById("listBtn2");

    if (listBtn1 && countryList) {
      bindButtonToElementDisplay(listBtn1, countryList);
    }

    if (listBtn2 && episodeList) {
      bindButtonToElementDisplay(listBtn2, episodeList);
    }

  } catch (error) {
    console.error("Error in main:", error);
    handleError(
      "🤒 Her har det skjedd noe feil! Prøv å laste inn siden på nytt eller kom tilbake senere."
    );
  }
};

const handleError = (errorMessage: string): void => {
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

main().catch((error) => {
  console.error("Asynchronous error", error);
  handleError(
    "🤒 Her har det skjedd noe feil! Prøv å laste inn siden på nytt eller kom tilbake senere."
  );
}); 