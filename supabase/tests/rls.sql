do $$
begin
  if has_table_privilege('anon', 'public.magazines', 'select')
     or has_table_privilege('anon', 'public.magazines', 'insert')
     or has_table_privilege('anon', 'public.magazines', 'update')
     or has_table_privilege('anon', 'public.magazines', 'delete') then
    raise exception 'anon must not have direct access to public.magazines';
  end if;

  if has_table_privilege('authenticated', 'public.magazines', 'select')
     or has_table_privilege('authenticated', 'public.magazines', 'insert')
     or has_table_privilege('authenticated', 'public.magazines', 'update')
     or has_table_privilege('authenticated', 'public.magazines', 'delete') then
    raise exception 'authenticated must not have direct access to public.magazines';
  end if;

  if has_table_privilege('anon', 'public.admin_login_rate_limits', 'select')
     or has_table_privilege('anon', 'public.admin_login_rate_limits', 'insert')
     or has_table_privilege('authenticated', 'public.admin_login_rate_limits', 'select') then
    raise exception 'login rate-limit data must not be directly accessible to browser roles';
  end if;

  if (select not relrowsecurity from pg_class where oid = 'public.magazines'::regclass) then
    raise exception 'RLS must be enabled on public.magazines';
  end if;
  if (
    select not relrowsecurity
    from pg_class
    where oid = 'public.admin_login_rate_limits'::regclass
  ) then
    raise exception 'RLS must be enabled on public.admin_login_rate_limits';
  end if;

  if not exists (
    select 1
    from storage.buckets
    where id = 'magazine-pdfs'
      and public = false
      and file_size_limit = 52428800
      and allowed_mime_types = array['application/pdf']
  ) then
    raise exception 'magazine-pdfs must be private and configured for PDF uploads up to 50 MiB';
  end if;
end;
$$;

select 'RLS and direct-grant checks passed' as result;
