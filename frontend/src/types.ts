import { z } from 'zod';

export const spotifyEpisodeSchema = z.object({
  ep: z.object({
    name: z.string(),
    release_date: z.string(),
    external_urls: z.object({
      spotify: z.string()
    })
  }),
  country: z.string()
});

export const episodeSchema = z.object({
  name: z.string(),
  release_date: z.date(),
  external_url: z.string(),
  spotify: z.string(),
  countryCodeISOA3: z.string(),
  countryName: z.string()
});

export const countryDataSchema = z.record(z.object({
  name: z.string(),
  name_no: z.string(),
  ISO_A3: z.string(),
  continent_no: z.string(),
  lat: z.number(),
  lon: z.number()
}));

export const episodeDataSchema = z.record(z.array(spotifyEpisodeSchema));

export const countryTranslationsSchema = z.record(z.string());

export const continentStatsSchema = z.record(z.object({
  covered: z.number(),
  total: z.number()
}));

export const geoJSONFeatureSchema = z.object({
  properties: z.object({
    ADMIN: z.string(),
    ISO_A3: z.string()
  }),
  geometry: z.any() 
});

// export const geoJSONResponseSchema = z.object({
//   features: z.array(geoJSONFeatureSchema),
//   type: z.string()
// });

// Type inference
export type SpotifyEpisode = z.infer<typeof spotifyEpisodeSchema>;
export type CountryData = z.infer<typeof countryDataSchema>;
export type EpisodeData = z.infer<typeof episodeDataSchema>;
export type CountryTranslations = z.infer<typeof countryTranslationsSchema>;
export type ContinentStats = z.infer<typeof continentStatsSchema>;
export type GeoJSONFeature = z.infer<typeof geoJSONFeatureSchema>;
export type GeoJSONResponse = {
  features: GeoJSONFeature[];
  type: string;
};
export type Episode = z.infer<typeof episodeSchema>;