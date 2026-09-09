# Fieldbook v0.6.5.2

Boundary persistence patch.

- Adds a GET endpoint for the saved field boundary.
- Normalizes Polygon, MultiPolygon, Feature, FeatureCollection, and JSON-string responses.
- Reloads the saved boundary directly from Supabase after the Mapbox map finishes loading.
- Keeps the existing auto-save and USDA soil lookup behavior.

No Supabase SQL or environment-variable changes are required.
