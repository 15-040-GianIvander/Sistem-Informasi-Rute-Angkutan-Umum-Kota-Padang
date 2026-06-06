from app.db import insert_stop, get_stops_geojson

f = insert_stop('Test Halte AI', -0.95, 100.42, fasilitas='Test fasilitas')
print('Inserted:', f['id'])
st = get_stops_geojson()
print('Total stops:', len(st['features']))
print('Last stop:', st['features'][-1]['properties']['nama_halte'])
