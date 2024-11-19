# read geojson file "country-geojson.json" and compress it to "country-geojson-compressed.json"

import json

with open('country-geojson-data.json') as f:
    data = json.load(f)

for feature in data['features']:
    coordinates = feature['geometry']['coordinates']

    for coord in coordinates:
        for coord2 in coord:
            for coord3 in coord2:
                # only keep 5 decimal places
                coord3[0] = round(coord3[0], 5)
                coord3[1] = round(coord3[1], 5)

# write to file
with open('country-geojson-compressed.json', 'w') as outfile:
    json.dump(data, outfile)