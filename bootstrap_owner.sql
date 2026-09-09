-- One-time example for a new installation.
-- Edit the email and organization name before running.

do $$
declare
  v_user_id uuid;
  v_org_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower('YOUR_EMAIL@example.com')
  limit 1;

  if v_user_id is null then
    raise exception 'No matching Supabase Auth user found';
  end if;

  select id into v_org_id
  from public.organizations
  where name = 'YOUR ORGANIZATION'
  limit 1;

  if v_org_id is null then
    insert into public.organizations (name)
    values ('YOUR ORGANIZATION')
    returning id into v_org_id;
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_user_id, 'owner')
  on conflict (organization_id, user_id)
  do update set role = 'owner';
end $$;
