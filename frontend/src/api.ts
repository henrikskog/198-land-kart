import {
  CountryData,
  EpisodeData,
  CountryTranslations,
  GeoJSONResponse,
  SpotifyEpisode,
  Episode,
  episodeSchema,
} from "./types";


export const TOTAL_COUNTRY_GEOJSON_SIZE = 12430424;

export const getCountryTranslations = async (): Promise<CountryTranslations> => {
  return fetch("/data/country_translations.json").then((res) => res.json());
};

export const getCountryCoords = async (): Promise<CountryData> => {
  return fetch("/data/country_general_data.json").then((res) => res.json());
};

export const getEpisodes = async (): Promise<EpisodeData> => {
  return fetch("/data/episodes_by_country.json").then((res) => res.json());
};

export async function fetchWithProgress<T>(
  url: string,
  totalSize: number,
  onProgress: (percent: number) => void
): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body!.getReader();
  let receivedLength = 0;

  const chunks: Uint8Array[] = [];
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

export const fetchGeoJSONData = async (): Promise<GeoJSONResponse> => {
  return fetch("/data/country-geojson-data-compressed.json").then((res) => res.json());
};

export const mapSpotifyEpisode = (ISO_A3: string, episode: SpotifyEpisode) => {
  const mapped: Episode = {
    countryCodeISOA3: ISO_A3,
    countryName: episode.country,
    name: episode.ep.name,
    release_date: new Date(episode.ep.release_date),
    spotify: episode.ep.external_urls.spotify,
    external_url: episode.ep.external_urls.spotify,
  };

  return episodeSchema.parse(mapped);
};
