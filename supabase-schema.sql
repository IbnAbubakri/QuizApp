-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- Creates the tables the quiz app needs.

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '📘',
  description text not null default '',
  accent text not null default '#6366f1',
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  question text not null,
  options jsonb not null,
  answer integer not null,
  explanation text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  student_name text not null default '',
  topic_id uuid references public.topics(id) on delete set null,
  topic_name text not null default '',
  score integer not null default 0,
  total integer not null default 0,
  percent integer not null default 0,
  failed_questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;

-- Teacher/admin detection. Grant admin by setting app_metadata.is_admin = true on the
-- teacher's auth.users row (see supabase-rls.sql for the UPDATE statement).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
$$;

-- Topics & questions: anyone may read; only teachers may write.
create policy "public read topics" on public.topics for select using (true);
create policy "teacher insert topics" on public.topics for insert with check (public.is_admin());
create policy "teacher update topics" on public.topics for update using (public.is_admin());
create policy "teacher delete topics" on public.topics for delete using (public.is_admin());

create policy "public read questions" on public.questions for select using (true);
create policy "teacher insert questions" on public.questions for insert with check (public.is_admin());
create policy "teacher update questions" on public.questions for update using (public.is_admin());
create policy "teacher delete questions" on public.questions for delete using (public.is_admin());

-- Attempts: students see their own; teachers see everything. Students may insert
-- their own attempts; only teachers may update/delete.
create policy "read own or admin attempts" on public.quiz_attempts for select using (public.is_admin() or user_id = auth.uid());
create policy "insert own attempts" on public.quiz_attempts for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "teacher update attempts" on public.quiz_attempts for update using (public.is_admin());
create policy "teacher delete attempts" on public.quiz_attempts for delete using (public.is_admin());

create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts(user_id);
