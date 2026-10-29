create table if not exists public.magazines (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null check (char_length(btrim(description)) between 1 and 5000),
  theme text not null check (char_length(btrim(theme)) between 1 and 120),
  semester smallint not null check (semester in (1, 2)),
  publication_year integer not null check (publication_year between 2000 and 2100),
  status text not null default 'draft' check (status in ('draft', 'published')),
  storage_path text not null unique check (
    storage_path ~ '^magazines/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'
  ),
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  file_size_bytes bigint not null check (file_size_bytes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists magazines_status_idx on public.magazines (status);
create index if not exists magazines_publication_year_idx on public.magazines (publication_year desc);
create index if not exists magazines_semester_idx on public.magazines (semester);
create index if not exists magazines_theme_idx on public.magazines (theme);
create index if not exists magazines_published_at_idx on public.magazines (published_at desc)
  where status = 'published';

create or replace function public.set_magazine_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists magazines_updated_at on public.magazines;
create trigger magazines_updated_at
before update on public.magazines
for each row execute function public.set_magazine_updated_at();

alter table public.magazines enable row level security;
revoke all on table public.magazines from public, anon, authenticated;
grant all on table public.magazines to service_role;
revoke all on function public.set_magazine_updated_at() from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('magazine-pdfs', 'magazine-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.admin_login_rate_limits (
  rate_key text primary key check (rate_key ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  updated_at timestamptz not null default now()
);

alter table public.admin_login_rate_limits enable row level security;
revoke all on table public.admin_login_rate_limits from public, anon, authenticated;
grant all on table public.admin_login_rate_limits to service_role;

create or replace function public.allow_admin_login_attempt(
  p_rate_key text,
  p_attempt_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_count integer;
begin
  if p_rate_key is null
     or p_rate_key !~ '^[0-9a-f]{64}$'
     or p_attempt_limit < 1
     or p_attempt_limit > 30
     or p_window_seconds < 60
     or p_window_seconds > 3600 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.admin_login_rate_limits as limits (
    rate_key,
    window_started_at,
    attempt_count,
    updated_at
  )
  values (p_rate_key, now(), 1, now())
  on conflict (rate_key) do update
  set window_started_at = case
        when limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then now()
        else limits.window_started_at
      end,
      attempt_count = case
        when limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then 1
        else limits.attempt_count + 1
      end,
      updated_at = now()
  returning attempt_count into v_attempt_count;

  return v_attempt_count <= p_attempt_limit;
end;
$$;

revoke all on function public.allow_admin_login_attempt(text, integer, integer) from public, anon, authenticated;
grant execute on function public.allow_admin_login_attempt(text, integer, integer) to service_role;

comment on table public.magazines is
  'Magazine metadata. All browser access is mediated by the same-origin Vercel API.';
comment on column public.magazines.published_at is
  'Set when first published; retained as historical date after unpublishing.';
