-- SPEC 13 — Puntuaciones atadas a una cuenta.
--
-- user_id es nullable porque el modo invitado sigue existiendo y porque las
-- filas anteriores a este spec no tienen dueño. `on delete set null` en vez de
-- `cascade`: borrar una cuenta no debe borrar el Salón de la Fama; la marca
-- sobrevive como anónima con su player_name intacto.

alter table public.scores
  add column user_id uuid references auth.users(id) on delete set null;

create index scores_user_id_idx on public.scores (user_id);

-- La política abierta permitía insertar una fila a nombre de cualquiera.
-- Con las dos nuevas, el user_id de una fila solo lo puede poner su dueño.
drop policy "anyone can insert a score" on public.scores;

create policy "guests insert anonymous scores" on public.scores
  for insert to anon with check (user_id is null);

create policy "users insert their own scores" on public.scores
  for insert to authenticated with check (user_id = auth.uid());

-- Cambiar el nick reescribe el histórico del jugador. Va en una función
-- security definer porque `scores` no tiene (ni tendrá) política de update.
create function public.rename_profile(new_name text)
returns void language plpgsql security definer set search_path = '' as $fn$
declare
  normalized text := upper(trim(new_name));
begin
  if auth.uid() is null then
    raise exception 'no session';
  end if;
  if normalized !~ '^[A-Z0-9_]{3,10}$' then
    raise exception 'invalid nick';
  end if;
  update public.profiles set display_name = normalized where id = auth.uid();
  update public.scores set player_name = normalized where user_id = auth.uid();
end;
$fn$;
