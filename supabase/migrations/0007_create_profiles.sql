-- SPEC 13 — Perfiles de usuario.
--
-- Un perfil es la identidad pública de una cuenta: su nick. El límite de 10
-- caracteres no es arbitrario, viene de scores.player_name (SPEC 01), donde el
-- nick tiene que caber sin truncar.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null unique
    check (display_name ~ '^[A-Z0-9_]{3,10}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Lectura pública deliberada: sin ella el formulario de registro no puede
-- decirte que un nick está ocupado. Solo expone nicks, que ya son públicos en
-- el Salón de la Fama — no el correo, que vive en auth.users.
create policy "profiles are publicly readable" on public.profiles
  for select using (true);

create policy "users insert their own profile" on public.profiles
  for insert with check (id = auth.uid());

create policy "users update their own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Solo crea el perfil cuando el alta trae nick (registro por email).
-- En OAuth no viene, y la pantalla /auth/nick se encarga.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $fn$
begin
  if new.raw_user_meta_data ? 'display_name' then
    insert into public.profiles (id, display_name)
    values (new.id, upper(new.raw_user_meta_data ->> 'display_name'));
  end if;
  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- handle_new_user solo tiene sentido como función de trigger. Sin este revoke
-- queda expuesta en /rest/v1/rpc/handle_new_user y el linter de Supabase la
-- marca (0028/0029). Llamarla suelta falla igualmente, pero no hay motivo
-- para publicarla.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
