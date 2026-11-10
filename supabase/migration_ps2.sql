-- PS-2 Migration: departments, attachments, Storage policy
-- Run this in the Supabase SQL editor AFTER schema.sql

-- 1. Department on users (officers)
alter table users add column if not exists department text;

-- 2. Attachments stored as JSON array [{name, path}] on complaints
alter table complaints add column if not exists attachments jsonb default '[]'::jsonb;
alter table complaints add column if not exists is_demo_seed boolean not null default false;
update complaints
set is_demo_seed = true
where citizen_name in (
  select 'Citizen ' || n || ' (fictional)' from generate_series(1, 20) as seq(n)
)
and citizen_phone between '9000020000' and '9000020019';
alter table complaints alter column tracking_id
  set default ('SPT' || upper(encode(gen_random_bytes(8), 'hex')));

create or replace function public.my_role()
returns public.user_role
language sql stable security definer
set search_path = ''
as $$ select role from public.users where id = auth.uid() $$;

-- 3. Set departments on seeded demo officers (run after npm run seed)
-- update users set department = 'Cybercrime Cell'  where name like '%Anita%';
-- update users set department = 'Traffic Division' where name like '%Mahesh%';
-- update users set department = 'General Crimes'   where name like '%Latha%';

-- 4. Keep complaint, audit, and config writes on authenticated server routes.
drop policy if exists "officer_update" on public.complaints;
drop policy if exists "senior_all" on public.complaints;
drop policy if exists "senior_read" on public.complaints;
create policy "senior_read" on public.complaints for select
  using (my_role() in ('senior','admin'));
drop policy if exists "cfg_admin" on public.app_config;
drop policy if exists "officer_upd_insert" on public.complaint_updates;

-- 5. Private Storage bucket and owner-scoped upload policy.
--    Remove any older broad authenticated INSERT policy on this bucket; policies OR together.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-docs',
  'complaint-docs',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "complaint_docs_insert_own" on storage.objects;
create policy "complaint_docs_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-docs'
    and exists (
      select 1 from public.complaints c
      where c.id::text = (storage.foldername(name))[1]
        and c.citizen_id = auth.uid()
    )
  );

-- The server creates short-lived signed links for public tracking. Object reads are not public.
