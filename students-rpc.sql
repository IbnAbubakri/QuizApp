-- Student directory for the admin panel. Run in the Supabase SQL editor
-- (or applied via the Management API, see supabase-rls.sql).
--
-- auth.users is not readable by the app's roles directly, so these are
-- SECURITY DEFINER functions that read it on the admin's behalf. Access is
-- gated on the caller's JWT carrying app_metadata.is_admin = true, so
-- students calling them get an empty result.

-- List students (non-admin users) with signup date and attempt summary.
create or replace function public.list_students()
returns table (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  attempt_count bigint,
  total_score bigint,
  best_percent integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data ->> 'full_name', ''),
    u.created_at,
    u.last_sign_in_at,
    count(a.id)::bigint,
    coalesce(sum(a.score), 0)::bigint,
    coalesce(max(a.percent), 0)::integer
  from auth.users u
  left join public.quiz_attempts a on a.user_id = u.id
  where public.is_admin()
    and coalesce(u.raw_app_meta_data ->> 'is_admin', 'false') <> 'true'
  group by u.id
  order by u.created_at;
$$;

revoke all on function public.list_students() from public;
grant execute on function public.list_students() to authenticated;

-- Total number of students (admins are excluded).
create or replace function public.student_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from auth.users u
  where public.is_admin()
    and coalesce(u.raw_app_meta_data ->> 'is_admin', 'false') <> 'true';
$$;

revoke all on function public.student_count() from public;
grant execute on function public.student_count() to authenticated;
