-- Auth user trigger: when a new auth.users row is created, link to an existing
-- participant by email (if found) or create a minimal participant record.
--
-- This allows participants who sign up via Auth to be automatically connected
-- to their pre-existing CSL profile without manual intervention.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id text;
  v_email text;
begin
  v_email := new.email;

  -- Attempt to find a participant whose handle matches the email (best-effort link).
  -- The participants table does not store email directly; attempt by user_id first.
  -- If user_id is already set on a participant (pre-linked), honour that row.
  select id into v_participant_id
  from public.participants
  where user_id is null
    and handle = v_email  -- fallback: handle equals email (import scenario)
  limit 1;

  if v_participant_id is not null then
    -- Link existing participant to the new auth user
    update public.participants
    set user_id = new.id
    where id = v_participant_id;
  else
    -- Create a minimal participant record for the new auth user so they have
    -- a CSL identity from the moment they sign up.
    insert into public.participants (id, handle, discipline, user_id, created_at)
    values (
      'p:' || substr(new.id::text, 1, 8),
      coalesce(
        new.raw_user_meta_data->>'handle',
        split_part(coalesce(v_email, new.id::text), '@', 1)
      ),
      coalesce(new.raw_user_meta_data->>'discipline', 'other'),
      new.id,
      now()
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- Drop and recreate to ensure idempotency on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

comment on function public.handle_new_auth_user() is
  'Links a new auth.users row to an existing participant by email/handle, or creates a minimal participant record.';
