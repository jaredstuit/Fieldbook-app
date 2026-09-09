# Fieldbook — Agronomy Field Manager v0.6.3

Private, invite-only agronomy workspace for Salida Ag.

## v0.6.3 adds

- Working **Fields** index in the sidebar
- Working **Samples** index in the sidebar
- Dated field notes with comma-separated tags
- Agronomic observations kept separate from ordinary notes
- Tissue, soil, water, and nematode sample entry
- Flexible sample-result rows: analyte, value, unit, qualifier
- Tissue starter rows for common nutrients
- A unified field timeline combining:
  - field notes
  - observations
  - samples
  - recommendations
  - actual applications
- Field record snapshot counts
- Dedicated sample history cards on each field
- Improved field-page navigation for desktop, iPad, and mobile

## Database

v0.6.3 intentionally reuses the v0.5 tables and RLS policies. **No new Supabase SQL migration is required** if the existing Salida Ag project successfully ran the v0.5 live database sync.

The new features use existing tables:

- `field_notes`
- `observations`
- `samples`
- `sample_results`
- `recommendations`
- `applications`
- `application_items`

## Deploying the update

Replace the files in the private GitHub repository with this v0.6.3 project (or use Git/GitHub Desktop), commit, and let Vercel deploy the new commit automatically.

The existing Vercel environment variables remain unchanged:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...
NEXT_PUBLIC_DEMO_MODE=false
```

## Recommended v0.6.3 test

Use the existing test field:

1. Add a field note with two or three tags.
2. Add an agronomic observation.
3. Add a tissue sample with several nutrient results.
4. Refresh the field.
5. Confirm all three records remain saved.
6. Confirm they appear in correct chronological order in the timeline.
7. Open the Samples sidebar page and confirm the sample appears there.

## Likely v0.7 target

- Private PDF/photo upload
- Sample PDF attachment
- Sample trend charts
- Recommendation/application entry UI
- Follow-up observations linked directly to an application
- Edit/delete controls with audit-conscious behavior
