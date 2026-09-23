-- specs/12-juego-frogger.md — paso 1
--
-- Reemplaza el placeholder RANARIA por el juego real FROGGER, mismo patrón que
-- 0002 (caida → tetris), 0003 (bloque-buster → arkanoid) y 0005 (serpentina →
-- snake): se actualiza la fila existente en vez de insertar una nueva, así el
-- catálogo no arrastra filas muertas y se heredan `best` y `plays`.
--
-- El UPDATE toca la primary key y `scores.game_id` la referencia por FK sin
-- ON UPDATE CASCADE. Verificado antes de aplicar: no existe ninguna fila en
-- `scores` con game_id = 'ranaria', así que la FK no se viola.
--
-- Se conservan tal cual cat = 'ARCADE', color = 'green' (el 'lime' del spec de
-- la game jam no existe: games_color_check solo admite cyan|magenta|yellow|green),
-- cover = 'cover-rana', best = 18900 y plays = '6.4K'.

update public.games
set
  id = 'frogger',
  title = 'FROGGER',
  short = 'Cruza la carretera y el río sin convertirte en papilla.',
  long = 'Guía a tu rana por cinco carriles de tráfico y un río de troncos y tortugas que se sumergen sin avisar. Llena las cinco bocas del otro lado para cerrar la ronda: cada nivel acelera todo un 15% y te recorta el tiempo. Tres vidas, quince segundos por intento y mucho asfalto por delante.',
  playable = true
where id = 'ranaria';
