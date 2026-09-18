update public.games
set
  id = 'snake',
  title = 'SNAKE',
  short = 'Crece serpenteando y devora frutas de neón sin morder tu propia cola.',
  long = 'Guía una serpiente de píxeles por una grilla de 20x20 en busca de frutas pixel-art —manzana, sandía, uva y dieciocho más, siempre al azar—. Cada bocado la alarga y acelera su paso cada cinco frutas. Chocar contra el borde del tablero o contra tu propia cola termina la partida al instante.',
  playable = true
where id = 'serpentina';
