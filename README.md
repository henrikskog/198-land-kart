# Kart med land omtalt i 198 Land med Einar Tørnquist

Tilgjengelig her: [henrikskog.github.io/198-land-kart](https://henrikskog.github.io/198-land-kart)

Interaktivt kart som viser hvilke land som har blitt omtalt i podcasten [198 land med Einar Tørnquist](https://open.spotify.com/show/7gVC1AP7O35An9TK6l2XpJ?si=7835f4c660794488).

## Funksjonalitet
- Interaktivt kart som viser landene som er omtalt i podcasten
- Daglig henting av nye episoder

## Dataoppdatering
Informasjonen om episodene hentes fra Spotify API og lagres i filen [episodes_by_country.json](./episodes_by_country.json). Denne filen oppdateres automatisk hver dag ved hjelp av en Azure Function. Koden for dette ligger i [azure-func](./azure-func
