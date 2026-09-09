# Fieldbook v0.6.5.1

Acceptance-test fixes:
- Field boundaries auto-save when drawn or edited.
- USDA soil lookup explicitly saves the current boundary before running.
- Map & Soils is forced dynamic so the saved boundary is not served from stale page cache.
- Edit forms now include Cancel buttons that return without saving changes.
- No Supabase SQL or environment-variable changes required.
