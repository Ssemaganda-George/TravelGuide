-- Drop historical page views with no usable country (local/dev / unresolved geo).
-- Going forward, /api/view only inserts rows with a real ISO country code.
delete from page_views
where country is null
   or btrim(country) = ''
   or upper(btrim(country)) in ('XX', 'T1', 'A1', 'A2', 'O1', 'UNKNOWN');

-- Allow signed-in admins to re-run the purge via RPC if needed.
create or replace function admin_purge_unknown_page_views()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare deleted_count integer;
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;
  delete from page_views
  where country is null
     or btrim(country) = ''
     or upper(btrim(country)) in ('XX', 'T1', 'A1', 'A2', 'O1', 'UNKNOWN');
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function admin_purge_unknown_page_views() from public;
grant execute on function admin_purge_unknown_page_views() to authenticated;
