# Game Jam — CRUZA LA CARRETERA Y EL RÍO SIN CONVERTIRTE EN PAPILLA

> **Fecha:** 2026-09-21 · **Conceptos:** 3 · **Numeración:** GJ-01 a GJ-03 · **Estado:** los tres en `Borrador`

El tema trae tres ingredientes bien separables: el asfalto con sus carriles, el agua que arrastra, y el propio acto de cruzar de abajo hacia arriba. En vez de meter los tres en un mismo juego —que es exactamente lo que ya hace el Frogger del backlog (`ranaria`)—, este jam los reparte: un juego se queda con la avenida, otro con el río, y el tercero con la corriente entendida como fuerza abstracta. El hilo que los une es el tránsito y su precio: en los tres, alguien intenta llegar al otro lado y el escenario no coopera. Lo que cambia es tu papel: primero eres el que cruza, después el que mira desde la orilla, y al final el suelo que otro pisa.

## Los tres conceptos

| #     | Juego   | `id`      | Categoría | Color   | Lente   | Verbo    | Esfuerzo | Spec                            | Diseño                              |
| ----- | ------- | --------- | --------- | ------- | ------- | -------- | -------- | ------------------------------- | ----------------------------------- |
| GJ-01 | ASFALTO | `asfalto` | ARCADE    | yellow  | literal | esquivar | bajo     | [spec](./GJ-01-asfalto/spec.md) | [diseño](./GJ-01-asfalto/design.md) |
| GJ-02 | BOYAS   | `boyas`   | SHOOTER   | cyan    | rol     | disparar | medio    | [spec](./GJ-02-boyas/spec.md)   | [diseño](./GJ-02-boyas/design.md)   |
| GJ-03 | VADO    | `vado`    | PUZZLE    | magenta | sistema | colocar  | medio    | [spec](./GJ-03-vado/spec.md)    | [diseño](./GJ-03-vado/design.md)    |

## Diversidad del trío

| Dimensión       | GJ-01 · ASFALTO                | GJ-02 · BOYAS                | GJ-03 · VADO                   |
| --------------- | ------------------------------ | ---------------------------- | ------------------------------ |
| Eje mecánico    | A · evasión / reflejo continuo | B · puntería y proyectiles   | C · colocación en grilla       |
| Rol del jugador | el que cruza                   | el que mira desde la orilla  | el suelo que otro pisa         |
| Vidas           | 3                              | 5                            | ninguna (`reportedLives = -1`) |
| Nivel           | `floor(carriles / 8) + 1`      | `floor(rescates / 6) + 1`    | `floor(pasos / 12) + 1`        |
| Qué acelera     | tráfico 90 → 260 px/s          | corriente 70 → 190 px/s      | corriente 5000 → 1800 ms       |
| Score principal | +10 por carril cruzado         | +25 por rescate              | +10 por paso del caminante     |
| Bonus           | +30 si el cruce va "al filo"   | +50 en el carril 4           | +100 por cruce completo        |
| Recurso escaso  | vidas y ventanas de paso       | 6 flotadores, recarga 900 ms | 5 piezas, erosión de 9 s       |
| Fin de partida  | tercer atropello               | quinto bañista perdido       | el caminante sale por abajo    |

## Los seis números cerrados de cada juego

Ningún concepto queda con parámetros "a definir". Estos son los seis valores fijados antes de escribir cada spec:

**GJ-01 · ASFALTO**

1. Evento principal: cruzar un carril nuevo del tramo = **+10**.
2. Bonus: cruce "al filo", con un coche de ese carril a menos de 24 px = **+30** en lugar de +10.
3. Nivel: `floor(carrilesCruzados / 8) + 1`.
4. Acelera: velocidad base del tráfico, 90 px/s, `+16 px/s` por nivel, **techo 260 px/s**.
5. Vidas: **3**.
6. Game over: perder la tercera vida por atropello.

**GJ-02 · BOYAS**

1. Evento principal: rescatar un bañista = **+25**.
2. Bonus: rescate en el carril 4, el de corriente fuerte = **+50**.
3. Nivel: `floor(rescates / 6) + 1`.
4. Acelera: corriente 70 px/s, `+12 px/s` por nivel, **techo 190 px/s**; intervalo de aparición 1600 ms, `-90 ms` por nivel, **piso 550 ms**.
5. Vidas: **5**, emitidas al montar y en cada `restart()`.
6. Game over: el quinto bañista alcanza su borde de escape.

**GJ-03 · VADO**

1. Evento principal: paso del caminante = **+10**.
2. Bonus: cruce completo, al llegar a la fila superior = **+100**.
3. Nivel: `floor(pasos / 12) + 1`.
4. Acelera: intervalo de la corriente 5000 ms, `-350 ms` por nivel, **piso 1800 ms**.
5. Vidas: **ninguna**, con el patrón `reportedLives = -1`.
6. Game over: un tick de corriente empuja al caminante fuera del tablero por abajo.

## Cómo se derivaron

- **Encaje con la plataforma.** Los tres producen un score numérico acumulativo que solo sube, un game over claro alcanzable en menos de cinco minutos, y estado íntegramente local al componente. Ninguno necesita red, persistencia propia ni más de una pantalla. Se descartó cualquier lectura narrativa del tema (un juego de "llegar al otro lado" sin puntuación) por no producir marcador competitivo.
- **Lentes del tema.** Literal → la carretera misma y sus vehículos (ASFALTO). Rol → el socorrista que trabaja en el río (BOYAS). Sistema → la corriente como fuerza que arrastra el tablero entero (VADO). El tema condiciona fantasía, nombres y paleta; las mecánicas son arcade sólidas y conocidas.
- **Diversidad.** Tres ejes mecánicos distintos (A/B/C), tres categorías distintas (ARCADE/SHOOTER/PUZZLE), tres colores distintos (yellow/cyan/magenta) y tres verbos distintos (esquivar/disparar/colocar). Se evitó a propósito el `green`, que ya cargan tres filas del catálogo (`snake`, `invasores`, `ranaria`), y se descartó el eje D (VERSUS local) porque `scores` solo guarda un `player_name` y un `score`.
- **No solape con lo ya implementado.** Cada `design.md` incluye la comparación explícita contra Asteroids, Tetris, Arkanoid y Snake, y además contra el placeholder `ranaria` (Frogger), que es el vecino más cercano del tema: ninguno de los tres usa salto por casillas ni plataformas móviles que arrastren al jugador.
- **Presupuesto de esfuerzo.** Los tres caben en un solo archivo `components/games/<Nombre>Game.tsx` de 300–450 líneas, con primitivas de canvas, colisiones AABB o por distancia y arrays de entidades simples. ASFALTO es el de esfuerzo bajo (una sola clase de entidad, el vehículo); BOYAS y VADO son medios. Sin imágenes, sin audio, sin dependencias npm nuevas, sin física de cuerpos rígidos y sin pathfinding (el caminante de VADO resuelve su avance con tres comprobaciones fijas).
- **Vidas, nivel y HUD.** ASFALTO usa 3 vidas (coincide con el `useState(3)` del HUD), BOYAS usa 5 y emite `onLivesChange(5)` al montar y en cada `restart()`, y VADO no tiene vidas y exige el patrón `reportedLives = -1` con precedente en `components/games/TetrisGame.tsx`. Los tres definen una fórmula concreta de `onLevelChange` con un parámetro acotado por piso o techo. Todo indicador extra (stock de munición, pieza siguiente, reloj de corriente, progreso del tramo) se dibuja dentro del canvas, porque el HUD solo tiene cuatro huecos y ya están ocupados.
- **Unicidad en el catálogo.** Los ids `asfalto`, `boyas` y `vado` son cortos, kebab-case y libres; los covers `cover-asfalto`, `cover-boyas` y `cover-vado` no existen en `app/globals.css`; y no hay ningún `components/games/AsfaltoGame.tsx`, `BoyasGame.tsx` ni `VadoGame.tsx`. Cada cover se describe con un máximo de tres formas geométricas planas y su ánimo cromático, sin fijar stops de gradiente.

## Colisiones verificadas el 2026-09-21

- **Ids ocupados en `public.games`:** `arkanoid`, `asteroids`, `duelo-pixel`, `gloton`, `invasores`, `ranaria`, `snake`, `tetris`.
- **Ids propuestos en jams anteriores:** ninguno — este es el primer jam, `specs/game-jam/` solo contenía un `.gitkeep`.
- **Clases `cover-*` en `app/globals.css`:** `cover-bg`, `cover-bricks`, `cover-tetro`, `cover-snake`, `cover-glot`, `cover-invaders`, `cover-asteroids`, `cover-rana`, `cover-duelo`.
- **Componentes existentes en `components/games/`:** `ArkanoidGame.tsx`, `AsteroidsGame.tsx`, `SnakeGame.tsx`, `TetrisGame.tsx` (+ `snake-sprites.ts`).
- Los tres ids y los tres `cover-*` de este jam son libres, y distintos entre sí.

## Qué falta para implementar

Estos specs **no** los ve `/spec-impl`: viven en subcarpeta y están en `Borrador`. Para llevar uno a código:

1. Elegir el concepto.
2. Copiarlo a `specs/<NN>-juego-<id>.md` con el siguiente número libre de la serie principal (hoy la serie llega hasta `09-juego-snake.md`, así que el siguiente libre es `10`), y renombrar el encabezado a `# SPEC <NN> — …`.
3. Leerlo, ajustarlo y cambiar el Estado a `Aprobado` **a mano** — eso lo hace el humano, no el agente.
4. Ejecutar `/spec-impl <NN>-juego-<id>`.
5. Tras implementar, actualizar `references/implemented-games.md` (lo mantiene quien implementa).

La numeración real de la migración también se decide al promover: la última aplicada es `0005_replace_serpentina_with_snake.sql`, así que el `000X` de cada spec pasará a ser `0006` en adelante.

## Riesgos del jam

- **Solape temático con `ranaria`.** El backlog reserva ese id para un Frogger clásico (salto por casillas + río con troncos). Ninguno de los tres conceptos lo consume ni lo reemplaza, y cada `design.md` explica la diferencia; aun así, si más adelante se implementa `ranaria`, ASFALTO será su vecino más cercano en el catálogo y conviene que ambos convivan con nombres y portadas bien distintos.
- **VADO es el concepto en el límite del presupuesto.** Tiene cuatro relojes simultáneos (corriente, erosión, recarga de stock y avance del caminante). Si en la implementación se acerca a las 450 líneas, la primera regla a recortar es el tablón de dos celdas, que es la menos estructural.
- **El bonus "al filo" de ASFALTO es el número menos calibrado del jam.** El umbral de 24 px sale de una estimación, no de una prueba jugada; conviene revisarlo en la primera sesión de prueba manual y ajustarlo en el spec antes de aprobarlo.
- **El backlog de `game-planner` no se ha tocado.** `references/game-suggestions.todo.md` sigue proponiendo `ranaria` como ficha propia y no sabe nada de estos tres conceptos; si alguno se promueve e implementa, ese archivo quedará desactualizado y lo tendrá que sincronizar su dueño.
