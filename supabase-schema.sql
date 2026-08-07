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

-- Open access for this project (no auth yet). Disable if you add RLS later.
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "public read topics" on public.topics for select using (true);
create policy "public write topics" on public.topics for all using (true) with check (true);
create policy "public read questions" on public.questions for select using (true);
create policy "public write questions" on public.questions for all using (true) with check (true);
create policy "public read quiz_attempts" on public.quiz_attempts for select using (true);
create policy "public write quiz_attempts" on public.quiz_attempts for all using (true) with check (true);
