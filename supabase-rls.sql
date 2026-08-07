-- RLS hardening migration
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor), or the file is idempotent.

-- 1. Helper: is the current user a teacher/admin?
--    Admin is granted by setting app_metadata.is_admin = true on auth.users
--    (e.g. UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb WHERE email = 'teacher@example.com');
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
$$;

-- 2. TOPICS: everyone may read; only teachers may write.
drop policy if exists "public write topics" on public.topics;
create policy "teacher insert topics" on public.topics
  for insert with check (public.is_admin());
create policy "teacher update topics" on public.topics
  for update using (public.is_admin());
create policy "teacher delete topics" on public.topics
  for delete using (public.is_admin());

-- 3. QUESTIONS: everyone may read (needed to take a quiz); only teachers may write.
drop policy if exists "public write questions" on public.questions;
create policy "teacher insert questions" on public.questions
  for insert with check (public.is_admin());
create policy "teacher update questions" on public.questions
  for update using (public.is_admin());
create policy "teacher delete questions" on public.questions
  for delete using (public.is_admin());

-- 4. QUIZ_ATTEMPTS: students see only their own; teachers see everything.
--    Students may insert their own attempts; only teachers may update/delete.
drop policy if exists "public read quiz_attempts" on public.quiz_attempts;
drop policy if exists "public write quiz_attempts" on public.quiz_attempts;
create policy "read own or admin attempts" on public.quiz_attempts
  for select using (public.is_admin() or user_id = auth.uid());
create policy "insert own attempts" on public.quiz_attempts
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "teacher update attempts" on public.quiz_attempts
  for update using (public.is_admin());
create policy "teacher delete attempts" on public.quiz_attempts
  for delete using (public.is_admin());

-- 5. Index for the dashboard query (filter by user_id).
create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts(user_id);
