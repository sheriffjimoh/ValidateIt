create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, plan_type, credits_used, credits_limit)
  values (new.id, new.email, 'free', 0, 3)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

insert into public.profiles (id, email, plan_type, credits_used, credits_limit)
select id, email, 'free', 0, 3
from auth.users
on conflict (id) do nothing;