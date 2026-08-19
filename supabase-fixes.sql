-- Audit fixes: server-side grading + security hardening.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor), or the file is idempotent.

-- 1. Server-side grading.
--    The client no longer computes the score. It sends the topic id plus an
--    object mapping question id -> chosen option index (or null for skipped).
--    This function re-reads the questions from the DB, grades them, and inserts
--    the attempt row with the server-computed score. It runs as SECURITY INVOKER
--    so it can only touch rows the signed-in student is allowed to touch.
create or replace function public.submit_attempt(
  p_topic_id uuid,
  p_answers jsonb
)
returns table (
  id uuid,
  user_id uuid,
  student_name text,
  topic_id uuid,
  topic_name text,
  score integer,
  total integer,
  percent integer,
  failed_questions jsonb,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_q record;
  v_chosen jsonb;
  v_score integer := 0;
  v_total integer := 0;
  v_percent integer := 0;
  v_failed jsonb := '[]'::jsonb;
  v_row quiz_attempts%rowtype;
begin
  if v_uid is null then
    raise exception 'You must be signed in to submit a result';
  end if;

  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Invalid answers payload';
  end if;

  select name into v_name from public.topics where public.topics.id = p_topic_id;
  if v_name is null then
    raise exception 'Topic not found';
  end if;

  for v_q in
    select q.id, q.question, q.options, q.answer, q.explanation
    from public.questions q
    where q.topic_id = p_topic_id
    order by q.created_at, q.id
  loop
    v_total := v_total + 1;
    v_chosen := p_answers -> v_q.id::text;

    if v_chosen is null
       or jsonb_typeof(v_chosen) <> 'number'
       or v_chosen::int < 0
       or v_chosen::int >= jsonb_array_length(v_q.options) then
      v_failed := v_failed || jsonb_build_object(
        'number', v_total,
        'question', v_q.question,
        'yourAnswer', null,
        'correctAnswer', v_q.options ->> v_q.answer,
        'explanation', coalesce(v_q.explanation, ''),
        'correct', false
      );
      continue;
    end if;

    if v_chosen::int = v_q.answer then
      v_score := v_score + 1;
    else
      v_failed := v_failed || jsonb_build_object(
        'number', v_total,
        'question', v_q.question,
        'yourAnswer', v_q.options ->> v_chosen::int,
        'correctAnswer', v_q.options ->> v_q.answer,
        'explanation', coalesce(v_q.explanation, ''),
        'correct', false
      );
    end if;
  end loop;

  if v_total > 0 then
    v_percent := round((v_score::numeric / v_total) * 100)::integer;
  end if;

  insert into public.quiz_attempts (
    user_id, student_name, topic_id, topic_name, score, total, percent, failed_questions
  ) values (
    v_uid,
    coalesce(nullif(trim(auth.jwt() -> 'user_metadata' ->> 'full_name'), ''), 'Student'),
    p_topic_id,
    v_name,
    v_score, v_total, v_percent,
    v_failed
  )
  returning * into v_row;

  return query
    select v_row.id, v_row.user_id, v_row.student_name, v_row.topic_id,
           v_row.topic_name, v_row.score, v_row.total, v_row.percent,
           v_row.failed_questions, v_row.created_at;
end;
$$;

-- Security is enforced inside the function via auth.uid() check.
-- We grant execute to authenticated explicitly. We do NOT revoke from
-- PUBLIC because PostgREST only exposes functions visible to the anon
-- role, and REVOKE FROM PUBLIC hides the function from PostgREST entirely.
grant execute on function public.submit_attempt(uuid, jsonb) to authenticated;

-- 2. Tighten function grants. is_admin / list_students / student_count are
--    SECURITY DEFINER and must never be callable by anon. (REVOKE ALL from
--    public in students-rpc.sql left the explicit anon grants in place.)
--    is_admin only reads auth.jwt(), so it is SECURITY INVOKER.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.list_students() from public, anon;
revoke all on function public.student_count() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.list_students() to authenticated;
grant execute on function public.student_count() to authenticated;

-- 3. Indexes for the teacher queries (join/filter on topic_id).
create index if not exists questions_topic_id_idx on public.questions(topic_id);
create index if not exists quiz_attempts_topic_id_idx on public.quiz_attempts(topic_id);

-- 4. RLS initplan: call auth.uid() / is_admin() once per statement instead of
--    per row. Rewrites the attempts policies so queries avoid per-row function
--    calls flagged by the security advisor.
drop policy if exists "read own or admin attempts" on public.quiz_attempts;
create policy "read own or admin attempts" on public.quiz_attempts
  for select using ((select public.is_admin()) or user_id = (select auth.uid()));

drop policy if exists "insert own attempts" on public.quiz_attempts;
create policy "insert own attempts" on public.quiz_attempts
  for insert with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "teacher update attempts" on public.quiz_attempts;
create policy "teacher update attempts" on public.quiz_attempts
  for update using ((select public.is_admin()));

drop policy if exists "teacher delete attempts" on public.quiz_attempts;
create policy "teacher delete attempts" on public.quiz_attempts
  for delete using ((select public.is_admin()));
