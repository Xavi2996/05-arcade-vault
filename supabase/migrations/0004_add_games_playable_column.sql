alter table public.games add column playable boolean not null default false;

update public.games
set playable = true
where id in ('asteroids', 'tetris', 'arkanoid');
