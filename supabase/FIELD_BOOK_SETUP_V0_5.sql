-- Fieldbook v0.5 clean database setup
-- Intended for a NEW Supabase project. The current Salida Ag database is already past this step.

create extension if not exists pgcrypto;
create schema if not exists gis;
create extension if not exists postgis with schema gis;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.growers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ranches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  grower_id uuid not null references public.growers(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.water_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  source_type text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ranch_id uuid not null references public.ranches(id) on delete cascade,
  name text not null,
  acres numeric(10,2),
  boundary gis.geometry(MultiPolygon, 4326),
  current_crop text,
  variety text,
  rootstock text,
  planting_year integer,
  irrigation_type text,
  water_source_id uuid references public.water_sources(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.field_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  observed_at timestamptz not null default now(),
  note text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.samples (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_id uuid references public.fields(id) on delete cascade,
  water_source_id uuid references public.water_sources(id) on delete cascade,
  sample_type text not null check (sample_type in ('tissue','soil','water','nematode')),
  sampled_at date not null,
  lab_name text,
  sample_label text,
  source_document_path text,
  notes text,
  created_at timestamptz not null default now(),
  check (field_id is not null or water_source_id is not null)
);

create table if not exists public.sample_results (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references public.samples(id) on delete cascade,
  analyte text not null,
  value numeric,
  text_value text,
  unit text,
  qualifier text,
  lab_reference_range text,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  recommended_at date not null,
  recommendation_type text,
  target_issue text,
  notes text,
  document_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  applied_at date not null,
  acres_treated numeric(10,2),
  total_cost numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.application_items (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  product_name text not null,
  active_ingredient text,
  rate numeric,
  rate_unit text,
  cost_per_acre numeric(10,2),
  notes text
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  observed_at timestamptz not null default now(),
  observation_type text,
  note text not null,
  rating numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_id uuid references public.fields(id) on delete cascade,
  grower_id uuid references public.growers(id) on delete cascade,
  document_type text,
  title text not null,
  storage_path text not null,
  document_date date,
  created_at timestamptz not null default now()
);

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

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

-- RLS
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.growers enable row level security;
alter table public.ranches enable row level security;
alter table public.water_sources enable row level security;
alter table public.fields enable row level security;
alter table public.field_notes enable row level security;
alter table public.samples enable row level security;
alter table public.sample_results enable row level security;
alter table public.recommendations enable row level security;
alter table public.applications enable row level security;
alter table public.application_items enable row level security;
alter table public.observations enable row level security;
alter table public.documents enable row level security;
alter table public.field_soils enable row level security;

create policy "members can read organizations"
on public.organizations for select to authenticated
using (public.is_org_member(id));

create policy "members can read memberships"
on public.organization_members for select to authenticated
using (user_id = auth.uid() or public.is_org_member(organization_id));

do $$
declare t text;
begin
  foreach t in array array[
    'growers','ranches','water_sources','fields','field_notes','samples',
    'recommendations','applications','observations','documents','field_soils'
  ]
  loop
    execute format('create policy "org members select" on public.%I for select to authenticated using (public.is_org_member(organization_id))', t);
    execute format('create policy "org members insert" on public.%I for insert to authenticated with check (public.is_org_member(organization_id))', t);
    execute format('create policy "org members update" on public.%I for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))', t);
    execute format('create policy "org members delete" on public.%I for delete to authenticated using (public.is_org_member(organization_id))', t);
  end loop;
end $$;

create policy "sample result members select" on public.sample_results
for select to authenticated using (
  exists(select 1 from public.samples s where s.id = sample_id and public.is_org_member(s.organization_id))
);
create policy "sample result members insert" on public.sample_results
for insert to authenticated with check (
  exists(select 1 from public.samples s where s.id = sample_id and public.is_org_member(s.organization_id))
);
create policy "sample result members update" on public.sample_results
for update to authenticated using (
  exists(select 1 from public.samples s where s.id = sample_id and public.is_org_member(s.organization_id))
);
create policy "sample result members delete" on public.sample_results
for delete to authenticated using (
  exists(select 1 from public.samples s where s.id = sample_id and public.is_org_member(s.organization_id))
);

create policy "application item members select" on public.application_items
for select to authenticated using (
  exists(select 1 from public.applications a where a.id = application_id and public.is_org_member(a.organization_id))
);
create policy "application item members insert" on public.application_items
for insert to authenticated with check (
  exists(select 1 from public.applications a where a.id = application_id and public.is_org_member(a.organization_id))
);
create policy "application item members update" on public.application_items
for update to authenticated using (
  exists(select 1 from public.applications a where a.id = application_id and public.is_org_member(a.organization_id))
);
create policy "application item members delete" on public.application_items
for delete to authenticated using (
  exists(select 1 from public.applications a where a.id = application_id and public.is_org_member(a.organization_id))
);

-- PostGIS RPCs use the dedicated gis schema.
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

-- Private storage bucket.
insert into storage.buckets (id, name, public)
values ('field-files', 'field-files', false)
on conflict (id) do update set public = false;

create policy "org members read field files"
on storage.objects for select to authenticated
using (bucket_id = 'field-files' and public.is_org_member(((storage.foldername(name))[1])::uuid));

create policy "org members upload field files"
on storage.objects for insert to authenticated
with check (bucket_id = 'field-files' and public.is_org_member(((storage.foldername(name))[1])::uuid));

create policy "org members update field files"
on storage.objects for update to authenticated
using (bucket_id = 'field-files' and public.is_org_member(((storage.foldername(name))[1])::uuid))
with check (bucket_id = 'field-files' and public.is_org_member(((storage.foldername(name))[1])::uuid));

create policy "org members delete field files"
on storage.objects for delete to authenticated
using (bucket_id = 'field-files' and public.is_org_member(((storage.foldername(name))[1])::uuid));

-- Explicit table privileges: anon gets none, authenticated gets API reachability;
-- RLS still decides which rows are visible/editable.
grant usage on schema public to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'organizations','organization_members','growers','ranches','water_sources','fields',
    'field_notes','samples','sample_results','recommendations','applications',
    'application_items','observations','documents','field_soils'
  ]
  loop
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  end loop;
end $$;

create index if not exists organization_members_user_id_idx on public.organization_members(user_id);
create index if not exists growers_organization_id_idx on public.growers(organization_id);
create index if not exists ranches_organization_id_idx on public.ranches(organization_id);
create index if not exists ranches_grower_id_idx on public.ranches(grower_id);
create index if not exists fields_organization_id_idx on public.fields(organization_id);
create index if not exists fields_ranch_id_idx on public.fields(ranch_id);
create index if not exists fields_boundary_gix on public.fields using gist (boundary);
create index if not exists field_notes_field_id_idx on public.field_notes(field_id);
create index if not exists samples_field_id_idx on public.samples(field_id);
create index if not exists recommendations_field_id_idx on public.recommendations(field_id);
create index if not exists applications_field_id_idx on public.applications(field_id);
create index if not exists observations_field_id_idx on public.observations(field_id);
create index if not exists documents_field_id_idx on public.documents(field_id);
create index if not exists field_soils_field_id_idx on public.field_soils(field_id);
