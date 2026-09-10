-- Fieldbook v0.7 - soil type boundary overlay on the field map.
-- Safe to run once. Adds a column only; no new table, no RLS changes
-- needed since field_soils already has RLS policies covering it.

alter table public.field_soils add column if not exists geometry jsonb;
