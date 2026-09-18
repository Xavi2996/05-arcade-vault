update public.games
set
  id = 'tetris',
  title = 'TETRIS',
  short = 'Encaja piezas antes de que el tablero se desborde.',
  long = 'Ocho piezas geométricas (las siete clásicas más una "tuerca" extra) descienden por un tablero de 10x20. Rótalas con wall kicks, usa la pieza fantasma para apuntar y la vista previa para planear, y limpia líneas antes de que el tablero se desborde. La velocidad aumenta cada 10 líneas.'
where id = 'caida';
