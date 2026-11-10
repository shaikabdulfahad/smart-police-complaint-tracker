create extension if not exists pgcrypto;
create type user_role as enum ('citizen','officer','senior','admin');
create type c_status as enum ('Submitted','Assigned','In Progress','Resolved','Overdue','Escalated');

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null, phone text, role user_role not null default 'citizen',
  superior_id uuid references users(id), is_demo_admin boolean default false,
  department text,
  created_at timestamptz default now());

create table complaints (
  id uuid primary key default gen_random_uuid(),
  tracking_id text unique not null default ('SPT' || upper(encode(gen_random_bytes(8), 'hex'))),
  citizen_id uuid references users(id),
  citizen_name text not null, citizen_phone text not null,
  category text not null check (category in ('Cybercrime','Financial Fraud','Lost Property','Traffic Complaints')),
  description text not null, location text not null,
  assigned_officer uuid references users(id),
  status c_status not null default 'Submitted',
  submitted_at timestamptz not null default now(),
  due_at timestamptz not null,
  resolved_at timestamptz,
  attachments jsonb default '[]'::jsonb,
  is_demo_seed boolean not null default false);
create index on complaints(status, due_at);
create index on complaints(assigned_officer);
create index on complaints(citizen_id);

create table reminder_logs (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  officer_id uuid references users(id), kind text not null default 'deadline',
  due_at timestamptz not null,
  simulated_at timestamptz not null, real_at timestamptz default now(),
  mode text not null, status text not null, provider_id text, error text,
  unique (complaint_id, kind, due_at));

-- escalation_logs: no unique(complaint_id) so reassigned complaints can re-escalate
create table escalation_logs (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  from_officer uuid references users(id), to_senior uuid references users(id),
  reason text not null, simulated_at timestamptz not null, real_at timestamptz default now());

create table complaint_updates (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  author uuid references users(id), status c_status, remark text,
  created_at timestamptz default now());

create table app_config (
  id int primary key default 1 check (id=1),
  demo_offset_hours int not null default 0,
  sla_hours int not null default 72, grace_hours int not null default 24);
insert into app_config default values;

alter table users enable row level security;
alter table complaints enable row level security;
alter table reminder_logs enable row level security;
alter table escalation_logs enable row level security;
alter table complaint_updates enable row level security;
alter table app_config enable row level security;

create or replace function public.my_role()
returns public.user_role
language sql stable security definer
set search_path = ''
as $$ select role from public.users where id = auth.uid() $$;

create policy "self" on users for select using (id = auth.uid() or my_role() in ('senior','admin'));
create policy "citizen_own" on complaints for select using (citizen_id = auth.uid());
create policy "officer_read" on complaints for select using (assigned_officer = auth.uid());
create policy "senior_read" on complaints for select using (my_role() in ('senior','admin'));
create policy "logs_staff" on reminder_logs for select using (my_role() in ('officer','senior','admin'));
create policy "esc_staff" on escalation_logs for select using (my_role() in ('senior','admin'));
create policy "upd_read" on complaint_updates for select using (
  exists (select 1 from complaints c where c.id = complaint_id
          and (c.citizen_id = auth.uid() or c.assigned_officer = auth.uid()))
  or my_role() in ('senior','admin'));
-- Anonymous tracking by ID goes through a server route using the service role, returning limited fields only.

-- Citizen self-registration (role locked to citizen)
create policy "citizen_signup" on users for insert with check (id = auth.uid() and role = 'citizen');

-- Private complaint documents can only be uploaded to a complaint owned by the caller.
create policy "complaint_docs_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-docs'
    and exists (
      select 1 from public.complaints c
      where c.id::text = (storage.foldername(name))[1]
        and c.citizen_id = auth.uid()
    )
  );
