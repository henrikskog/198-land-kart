# 198 Land med Einar Tørnquist podcast Kart

Dette prosjektet er enkelt og greit et interaktivt kart som viser hvilke land som har blitt omtalt i podcasten [198 land med Einar Tørnquist](https://open.spotify.com/show/7gVC1AP7O35An9TK6l2XpJ?si=7835f4c660794488). Kartet gir lytterne en visuell oversikt over de ulike landene som er dekket i episodene.

## Funksjoner
- Interaktivt kart som viser landene som er omtalt i podcasten
- Oppdateres daglig med informasjon om nye episoder

## Dataoppdatering
Informasjonen om episodene hentes fra Spotify API og lagres i filen [episodes_by_country.json](./episodes_by_country.json). Denne filen oppdateres automatisk hver dag ved hjelp av en Azure Function. Koden for dette ligger i [azure-func](./azure-func)

## Se kartet live
Kartet er tilgjengelig på nettet og kan besøkes her: [henrikskog.github.io/198-land-kart](https://henrikskog.github.io/198-land-kart)

## Kontakt og bidrag
Hvis du har spørsmål, forslag til forbedringer eller ønsker å bidra til prosjektet er det bare å åpne et issue eller ta kontakt på mail: henrikskog01@gmail.com

---
