-- Fieldbook v0.5 LIVE DATABASE SYNC
-- For the existing Salida Ag Supabase project after the earlier v0.3/v0.4 setup steps.
-- Safe to run once before deploying v0.5.

create schema if not exists gis;
create extension if not exists postgis with schema gis;

-- Ensure the corrected soil table exists.
create table if not exists public.field_soils (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  mukey text,
  musym text,
  muname text not null,
  acres numeric(12,4),
  percent_of_field numeric(7,3),
  source text not null default 'USDA NRCS SSURGO',
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.field_soils enable row level security;

-- Create policies only if they are missing.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='field_soils' and policyname='org members select field soils') then
    create policy "org members select field soils" on public.field_soils for select to authenticated using (public.is_org_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='field_soils' and policyname='org members insert field soils') then
    create policy "org members insert field soils" on public.field_soils for insert to authenticated with check (public.is_org_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='field_soils' and policyname='org members update field soils') then
    create policy "org members update field soils" on public.field_soils for update to authenticated
      using (public.is_org_member(organization_id))
      with check (public.is_org_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='field_soils' and policyname='org members delete field soils') then
    create policy "org members delete field soils" on public.field_soils for delete to authenticated using (public.is_org_member(organization_id));
  end if;
end $$;

grant usage on schema public to authenticated;
revoke all on table public.field_soils from anon;
grant select, insert, update, delete on public.field_soils to authenticated;

create index if not exists field_soils_field_id_idx on public.field_soils(field_id);
create index if not exists fields_boundary_gix on public.fields using gist (boundary);

-- Replace the earlier RPC implementations that referenced PostGIS functions in public.
create or replace function public.save_field_boundary(p_field_id uuid, p_geometry jsonb, p_acres numeric)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean;
  geom gis.geometry;
begin
  select public.is_org_member(f.organization_id) into allowed
  from public.fields f where f.id = p_field_id;

  if coalesce(allowed, false) is not true then
    raise exception 'Not authorized for this field';
  end if;

  geom := gis.ST_SetSRID(gis.ST_GeomFromGeoJSON(p_geometry::text), 4326);

  if gis.ST_IsValid(geom) is not true then
    raise exception 'Invalid field polygon';
  end if;

  update public.fields
  set boundary = gis.ST_Multi(geom), acres = p_acres, updated_at = now()
  where id = p_field_id;

  return true;
end;
$$;

revoke all on function public.save_field_boundary(uuid, jsonb, numeric) from public;
grant execute on function public.save_field_boundary(uuid, jsonb, numeric) to authenticated;

create or replace function public.get_field_boundary_geojson(p_field_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select case when f.boundary is null then null else gis.ST_AsGeoJSON(f.boundary)::jsonb end
  from public.fields f
  where f.id = p_field_id;
$$;

revoke all on function public.get_field_boundary_geojson(uuid) from public;
grant execute on function public.get_field_boundary_geojson(uuid) to authenticated;

-- If the obsolete v0.3 table exists, preserve any rows into field_soils and then remove it.
do $$
begin
  if to_regclass('public.field_soil_mapunits') is not null then
    insert into public.field_soils
      (organization_id, field_id, mukey, musym, muname, acres, percent_of_field, source, retrieved_at)
    select
      organization_id, field_id, mukey, mapunit_symbol,
      coalesce(mapunit_name, 'Unknown USDA map unit'),
      acres, percent_of_field, source, queried_at
    from public.field_soil_mapunits old
    where not exists (
      select 1 from public.field_soils s
      where s.field_id = old.field_id
        and coalesce(s.mukey,'') = coalesce(old.mukey,'')
    );

    drop table public.field_soil_mapunits;
  end if;
end $$;
