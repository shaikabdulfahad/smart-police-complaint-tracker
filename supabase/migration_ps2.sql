-- PS-2 Migration: departments, attachments, Storage policy
-- Run this in the Supabase SQL editor AFTER schema.sql

-- 1. Department on users (officers)
alter table users add column if not exists department text;

-- 2. Attachments stored as JSON array [{name, url}] on complaints
alter table complaints add column if not exists attachments jsonb default '[]'::jsonb;

-- 3. Set departments on seeded demo officers (run after npm run seed)
-- update users set department = 'Cybercrime Cell'  where name like '%Anita%';
-- update users set department = 'Traffic Division' where name like '%Mahesh%';
-- update users set department = 'General Crimes'   where name like '%Latha%';

-- 4. Storage bucket: create manually in Supabase dashboard:
--    Storage → New bucket → Name: complaint-docs → Public: false
--    Then Policies → New policy → For authenticated users → INSERT allowed

-- 5. Anonymous users can read complaint attachments via the track API (server uses service role)
-- No additional RLS needed for attachments column; it's on the complaints table which already has RLS.

-- PS-2 bug fix: officer remark INSERT policy (add this if running schema.sql already applied)
-- Only needed if you ran schema.sql before this fix:
-- create policy "officer_upd_insert" on complaint_updates for insert
--   with check (
--     exists (select 1 from complaints c where c.id = complaint_id and c.assigned_officer = auth.uid())
--     or my_role() in ('senior','admin'));
