# Sugerencias de juegos

Backlog de candidatos para el catálogo de Arcade Vault. Lo mantiene el agente
`game-planner` (`.claude/agents/game-planner.md`) — no lo edites a mano salvo
para corregir un error; el agente edita este archivo de forma incremental.

Flujo: `game-planner` decide y escribe aquí → tú lanzas `/spec-juego` con la
ficha del recomendado → `/spec-impl` lo implementa.

Fuente de verdad de lo ya jugable: `references/implemented-games.md`.

> **Ronda de exploración 2026-09-21.** Cuatro pasadas en paralelo (una por
> categoría) generaron **20 propuestas / 18 conceptos distintos**, ya
> consolidados y priorizados abajo. **No hace falta volver a derivarlos.**
> Ese mismo día el usuario cerró tres decisiones de alcance — ver
> [Decisiones tomadas](#-decisiones-tomadas-2026-09-21).

---

## Cómo se prioriza aquí

**La tabla `games` puede crecer.** El usuario confirmó el 2026-09-21 que se
añaden filas nuevas según se vayan implementando juegos, así que **no hay
escasez de huecos**: cualquiera de los 18 conceptos puede tener su propia fila.
El orden de abajo sale de la rúbrica normal, no de competir por un hueco:

1. **Encaje duro** — score numérico acumulativo + game over claro que dispare
   `onGameOver(finalScore)`.
2. **Hueco de categoría** — hoy VERSUS 0, PUZZLE 1, SHOOTER 1, ARCADE 2.
3. **Solape de mecánica** con lo ya implementado.
4. **Esfuerzo** bajo el contrato `forwardRef` compartido.
5. **Desempate:** las 4 filas preexistentes (`duelo-pixel`, `invasores`,
   `ranaria`, `gloton`) ya tienen id, título, `short`, `long` y `cover`
   escritos → **cero trabajo de catálogo**. Es una ventaja modesta y concreta,
   no un filtro: un candidato mejor con fila nueva las pasa sin problema.

**Coste de una fila nueva** (aplica a 14 de los 18 conceptos): un `insert` en
`games`, escribir `short` y `long`, y **una clase `.cover-*` de pixel-art nueva
en `app/globals.css`** — los covers no son imágenes, son CSS escrito a mano
(hallazgo 5). Es real pero pequeño comparado con el juego en sí.

## Orden recomendado

| #     | Juego             | Cat · color       | Esfuerzo   | Fila   | Motivo del puesto                                      |
| ----- | ----------------- | ----------------- | ---------- | ------ | ------------------------------------------------------ |
| **1** | **`duelo-pixel`** | VERSUS · cyan     | bajo       | existe | Única categoría vacía, esfuerzo mínimo, cero catálogo  |
| 2     | `fusion-2048`     | PUZZLE · yellow   | bajo       | nueva  | Barato, game over impecable, solape cero               |
| 3     | `invasores`       | SHOOTER · green   | medio      | existe | El más seguro del backlog, cero catálogo               |
| 4     | `estelas`         | VERSUS · magenta  | bajo       | nueva  | Reaprovecha `SnakeGame.tsx`; frena el solape con Snake |
| 5     | `memoria-neon`    | ARCADE · cyan     | bajo       | nueva  | El más barato de todos; frena el audio y ARCADE lleno  |
| 6     | `salto-neon`      | ARCADE · magenta  | bajo       | nueva  | Barato y sin solape; ARCADE ya va sobrada              |
| 7     | `ranaria`         | ARCADE · green    | medio      | existe | Mecánica única, cero catálogo; refuerza ARCADE y green |
| 8     | `artilleria`      | VERSUS · green    | medio      | nueva  | CPU trivial de calibrar, ideal en 2P por turnos        |
| 9     | `tuberia`         | PUZZLE · green    | medio      | nueva  | Único PUZZLE con vidas genuinas                        |
| 10    | `defensa-orbital` | SHOOTER · magenta | medio      | nueva  | Único SHOOTER defensivo; sin avatar que mover          |
| 11    | `tanques`         | VERSUS · magenta  | medio      | nueva  | Rebote geométrico; excelente en 2P                     |
| 12    | `gemas-neon`      | PUZZLE · cyan     | medio      | nueva  | Sólido; casos borde del tablero inicial                |
| 13    | `modulo-lunar`    | ARCADE · yellow   | medio      | nueva  | Reusa vectores de Asteroids… y su sensación            |
| 14    | `campo-neon`      | PUZZLE · magenta  | bajo-medio | nueva  | El azar envenena el ranking                            |
| 15    | `ciempies`        | SHOOTER · cyan    | medio-alto | nueva  | El más original; caro en entidades y pathing           |
| 16    | `justa`           | VERSUS · yellow   | medio-alto | nueva  | Identidad VERSUS falsa (es PvE)                        |
| 17    | `bodega`          | PUZZLE · cyan     | medio-alto | nueva  | Sin game over natural; juego de contenido              |
| 18    | `gloton`          | ARCADE · yellow   | **alto**   | existe | Encaje perfecto, pero son varias sesiones              |

Descartados por colisión, no por mérito: `tanques-neon` y `mortero-neon` — ver
[Colisiones](#-colisiones-a-resolver).

## 🎯 Próximo recomendado

- [ ] **DUELO PIXEL** (`duelo-pixel`) · VERSUS · cyan

  **Por qué:** VERSUS es la única categoría sin ningún juego jugable — el hueco
  más grande del catálogo. Su fila ya existe, así que **no cuesta ni copy ni
  cover CSS**. Mecánica sin solape: es el único juego reactivo de rebote 1v1;
  Arkanoid rebota contra bloques estáticos, no contra un rival. Sobrevivió a la
  ronda de 20 candidatos y a todas las decisiones de alcance del usuario: sigue
  siendo el mejor encaje, y con la tabla libre gana todavía más, porque su
  ventaja de esfuerzo ya no depende de ninguna escasez.

  **Esfuerzo:** bajo — el más bajo del backlog. Dos rectángulos y un círculo,
  colisión AABB, sin sprites, sin assets, sin pathfinding.
  **Fuente:** desde cero (no quedan templates sin usar).

  **Alcance v1: dos modos.**
  1. **1P vs CPU** — la CPU sigue la Y de la pelota con **error gaussiano** y
     **velocidad tope**, y **solo reacciona cuando la pelota va hacia ella**.
     Esos tres parámetros son la palanca de dificultad por nivel.
  2. **2P local** en el mismo teclado (decisión del usuario, ver abajo).

  ✅ **El `long` de la fila ya prometía 2 jugadores locales, así que el copy
  existente queda correcto tal cual.** No hay que retocar nada de catálogo.

  **Controles:** P1 `ArrowUp`/`ArrowDown`. En 2P, P2 con `W`/`S`.
  (El rechazo de WASD en Snake fue para el _único_ jugador; aquí W/S es la
  convención estándar del segundo jugador en teclado compartido y no compite con
  las flechas. **Sin confirmar por el usuario** — plantéaselo en el spec.)

  **Vidas:** sí — 5. Cada punto que encaja el rival resta una vida a P1.
  **Nivel:** en 1P, sube cada 3 puntos (acelera pelota y CPU). En 2P no hay
  rampa de dificultad, así que **nivel = número de set**.

  **Score:** `+10` por cada punto anotado, `+1` por cada rebote de tu propia
  paleta. Acumulativo y monótono creciente.
  **Game over:** al perder las 5 vidas → `onGameOver(score)`.

  ### Regla de persistencia en 2P (decisión de diseño)

  **Se persiste siempre la puntuación del Jugador 1.** No la del ganador.

  **Por qué:** `GamePlayer` pide **un solo** `player_name` en el modal de fin, y
  ese nombre lo teclea quien tiene el teclado. Si guardáramos "la del ganador" y
  ganara P2, el ranking acreditaría a un nombre el rendimiento de otra persona —
  un registro que miente. Con P1 la regla es **determinista y sin ramas**: el
  nombre tecleado y el score guardado son siempre del mismo jugador, gane o
  pierda. Y no exige tocar el esquema de `scores`, que es la condición que puso
  el usuario.

  **HUD en 2P:** el de `GamePlayer` es de un jugador (score + vidas + nivel) y no
  admite un cuarto indicador. **El marcador de P2 se dibuja dentro del canvas**,
  junto a su paleta. El HUD sigue mostrando siempre lo de P1, coherente con la
  regla de persistencia.

  **Riesgos:**
  - ⚠️ **Integridad del ranking:** un P2 complaciente permite inflar el score de
    P1 sin límite, y esas entradas conviven con las de 1P vs CPU en el mismo
    leaderboard. Es el precio de aceptar 2P sin tocar `scores`. Mitigación a
    decidir en el spec: o se asume, o el modo 2P **no guarda** y queda como modo
    amistoso. Recomendación: planteárselo explícitamente al usuario.
  - `scores.score > 0` es un check constraint. El `+1` por rebote lo evita: es
    imposible perder sin haber rebotado al menos una vez.
  - Calibrar la CPU del modo 1P para que sea vencible pero no trivial; una CPU
    sin error es imbatible y rompe la progresión de score.

  **Decidido:** 2026-09-21 · Reconfirmado tres veces el mismo día: tras la ronda
  de 20, tras las decisiones de alcance y tras liberarse la tabla `games`.

## 📋 Backlog

Los 17 restantes, agrupados por categoría y ordenados por encaje dentro de cada
una. El puesto global de cada uno está en la
[tabla de orden recomendado](#orden-recomendado).

### VERSUS — la categoría más vacía

_Cero juegos jugables. Además **2P local está aprobado**, y eso abarata todo el
bloque: en modo 2P la IA deja de ser obligatoria, y calibrar la CPU era su parte
más cara._

- [ ] **ESTELAS** (`estelas`) · magenta · esfuerzo **bajo** · fila nueva · **#4**
      Tron: motos de luz en rejilla, estelas permanentes, CPU con lookahead de
      pocas casillas.
      **Ventaja técnica fuerte:** reaprovecha casi toda la arquitectura de
      tick + grid de `components/games/SnakeGame.tsx`, y en 2P local ni siquiera
      necesita IA. El mejor VERSUS después de `duelo-pixel`.
      **Score:** por casilla sobrevivida + bonus por ronda ganada.
      **Único lastre:** **solapa con Snake** — moverse en grilla evitando chocar
      con un rastro. Es lo único que lo mantiene fuera del podio.

- [ ] **ARTILLERÍA** (`artilleria`) · green · esfuerzo **medio** · fila nueva · **#8**
      Duelo balístico por turnos con terreno destructible. La CPU se reduce a
      **un único número de error de puntería**: trivial de calibrar, ventaja real
      frente a cualquier IA de movimiento.
      **Por turnos:** aceptado por el usuario, ya no penaliza. En 2P local el
      formato por turnos es incluso **más natural** (se alternan el teclado).
      **Riesgo:** necesita puntos de consolación para no terminar en 0; la UI de
      ángulo/potencia va dentro del canvas.
      ⚠️ Ganó la colisión contra `mortero-neon`.

- [ ] **TANQUES** (`tanques`) · magenta · esfuerzo **medio** · fila nueva · **#11**
      Duelo top-down en arena: balas que **rebotan hasta 2 veces**, cajas
      destructibles, CPU con línea de visión.
      **A favor:** el rebote convierte cada disparo en un problema geométrico —
      sensación propia, distinta de todo lo demás. Excelente en 2P local.
      **Vidas:** impactos recibidos. **Nivel:** dificultad de la CPU / ronda.
      ⚠️ Ganó la colisión contra `tanques-neon`.

- [ ] **JUSTA** (`justa`) · yellow · esfuerzo **medio-alto** · fila nueva · **#16**
      Joust: vuelo con aleteo, gana el choque quien lleva la lanza más alta.
      **Riesgos:** (a) la regla de altura es **poco legible sin animación** de
      calidad — el jugador no entiende por qué perdió; (b) su **identidad VERSUS
      es discutible**: en la práctica son oleadas PvE, así que no llena el hueco
      de categoría, que era la razón principal para elegirlo.

### PUZZLE — solo tiene Tetris

- [ ] **FUSIÓN 2048** (`fusion-2048`) · yellow · esfuerzo **bajo** · fila nueva · **#2**
      2048 en rejilla 4×4. **El mejor candidato después del recomendado.**
      **Controles:** 4 flechas. **Score:** suma de todas las fusiones.
      **Nivel:** exponente de la ficha más alta lograda.
      **Vidas:** **no** → `onLivesChange(0)` + el truco `reportedLives = -1`
      (hallazgo 3).
      **A favor:** su game over es de los más fuertes y naturales del backlog
      (tablero lleno sin movimientos posibles), el score es inequívoco, el
      esfuerzo es bajo y **no solapa con nada** del catálogo.
      **Por turnos:** sí, y **el usuario ya lo aceptó** — `paused` decorativo no
      es un problema.

- [ ] **TUBERÍA** (`tuberia`) · green · esfuerzo **medio** · fila nueva · **#9**
      Trazar la cañería antes de que el fluido llegue al final.
      **El único PUZZLE del backlog con vidas genuinas** (3 válvulas) → usa el
      HUD completo (score + vidas + nivel) **sin ningún truco**. Es el PUZZLE
      mejor alineado con la plataforma; pierde ante `fusion-2048` solo por
      esfuerzo.
      **Score:** por tramo recorrido por el fluido.
      **Riesgos:** curva de aprendizaje empinada; la cola de piezas siguientes
      debe dibujarse en el canvas.

- [ ] **GEMAS NEÓN** (`gemas-neon`) · cyan · esfuerzo **medio** · fila nueva · **#12**
      Match-3 con cascadas y multiplicador, contra reloj.
      **Controles:** cursor con flechas + `Space`.
      **Riesgos:** generar un tablero inicial **sin matches previos y con al
      menos un movimiento válido garantizado** tiene casos borde molestos; el
      score de una cascada debe **acumularse y emitirse una sola vez**, no un
      `onScoreChange` por eslabón (el HUD parpadearía).

- [ ] **CAMPO NEÓN** (`campo-neon`) · magenta · esfuerzo **bajo-medio** · fila nueva · **#14**
      Buscaminas con cursor de teclado. **Vidas:** 3 minas pisadas.
      **Riesgo de fondo:** los **50/50 irresolubles matan por azar**, y eso
      **envenena un leaderboard competitivo** — que es literalmente el punto de
      Arcade Vault. Exigir tableros siempre deducibles lo arregla pero sube el
      esfuerzo a **medio-alto**. Decide esto antes del spec, no durante.

- [ ] **BODEGA** (`bodega`) · cyan · esfuerzo **medio-alto** · fila nueva · **#17**
      Sokoban. **El peor encaje de los 18, va al fondo a propósito:** (a) **no
      tiene game over natural** — el límite de intentos sería impuesto, y el
      criterio duro de la plataforma pide un game over claro; (b) es un **juego
      de contenido**, su valor está en niveles diseñados a mano, no en código;
      (c) score discreto a saltos → **muchos empates en el ranking**.

### SHOOTER — solo tiene Asteroids

- [ ] **INVASORES** (`invasores`) · green · esfuerzo **medio** · **fila existe** · **#3**
      Space Invaders. **El candidato más seguro del backlog entero** y la
      alternativa número 1 si `duelo-pixel` se cae.
      **Score:** +10/+20/+30 según la fila del alien, más nave nodriza.
      **Vidas:** sí, 3. **Nivel:** oleada.
      **Encaje con el contrato: sin ninguna fricción**, y cero trabajo de
      catálogo.
      **Riesgos:** los **búnkeres destructibles por píxel** son el coste
      dominante — recortarlos a bloques enteros baja el esfuerzo a **bajo**, y es
      decisión del spec, no de la implementación; hay **doble condición de game
      over** (perder 3 vidas **o** que la formación toque el suelo) y el segundo
      caso es fácil de olvidar.
      **Solape:** parcial con Asteroids (ambos disparan en el espacio), pero el
      cañón horizontal contra formación descendente no se parece a la rotación
      inercial 360°.

- [ ] **DEFENSA ORBITAL** (`defensa-orbital`) · magenta · esfuerzo **medio** · fila nueva · **#10**
      Missile Command. **No controlas una nave**: controlas un punto de
      detonación con retardo, y las explosiones encadenan.
      **Cúpulas: 3, no 6** — el HUD pinta vidas como corazones y se desborda
      (hallazgo 1). Restricción de diseño, no de gusto.
      **Score:** por misil interceptado, bonus por cadena. **Nivel:** oleada.
      **No solapa:** único SHOOTER **defensivo y predictivo**; no hay avatar que
      mover.
      **Riesgo:** apuntar con flechas puede sentirse lento frente al mouse —
      **Arkanoid ya acepta mouse**, hay precedente en el repo para ofrecerlo.

- [ ] **CIEMPIÉS** (`ciempies`) · cyan · esfuerzo **medio-alto** · fila nueva · **#15**
      Centipede. Su gracia real: la cadena **se parte en dos** al dispararle en
      mitad del cuerpo y **planta un hongo** — el terreno es emergente y el
      jugador acaba construyendo su propia trampa. **El concepto más original del
      backlog SHOOTER**; solo el coste lo mantiene abajo.
      **Riesgo:** la fragmentación genera **muchas entidades vivas** y el pathing
      de cada segmento contra la grilla de hongos es la parte cara — ahí se va el
      esfuerzo, no en el render.

### ARCADE — ya tiene 2 de 4

_Es la categoría sobrerrepresentada: un ARCADE nuevo necesita justificar algo más
que ser barato._

- [ ] **MEMORIA NEÓN** (`memoria-neon`) · cyan · esfuerzo **bajo** · fila nueva · **#5**
      Simon: 4 cuadrantes mapeados a las 4 flechas. **El más barato de los 18**:
      máquina de estados pura, sin bucle de físicas ni colisiones.
      **Vidas:** 3 fallos. **Nivel:** longitud de la secuencia.
      **No solapa:** único juego de memoria/reflejo no espacial.
      **Riesgos:** (a) score 0 si falla la ronda 1 tres veces → puntuar **por
      acierto individual**, no por ronda; (b) su identidad depende del **audio**
      y **ningún juego del repo usa audio todavía** — estrenaría una capa nueva;
      (c) pausar una secuencia con `setTimeout` es más delicado que congelar un
      `requestAnimationFrame`, que es lo que hacen los 4 juegos actuales.

- [ ] **SALTO NEÓN** (`salto-neon`) · magenta · esfuerzo **bajo** · fila nueva · **#6**
      Plataformeo vertical infinito: salto automático al tocar plataforma, tú
      solo desplazas. **Controles:** solo ←/→, con wrap lateral.
      **Score:** altura máxima. **Nivel:** +1 cada 1000 de altura.
      **Vidas:** no naturales → `onLivesChange(1)` al iniciar y `(0)` al caer.
      **No solapa:** único juego de scroll vertical infinito.
      **Riesgos:** score 0 si cae en el primer salto (check `score > 0`) — hay
      que garantizar un mínimo; aplica el gotcha de `restart()` (hallazgo 3).

- [ ] **RANARIA** (`ranaria`) · green · esfuerzo **medio** · **fila existe** · **#7**
      Frogger: cruzar carriles de coches y luego un río saltando sobre troncos.
      **Controles:** flechas, movimiento discreto casilla a casilla.
      **Score:** +10 por fila nueva alcanzada, +50 por nenúfar ocupado, bonus por
      tiempo restante, +1000 al llenar los 5 nenúfares.
      **Vidas:** sí, 3. **Nivel:** +1 por tablero limpio.
      **No solapa:** ni dispara, ni crece, ni encaja piezas — la única mecánica
      de esquiva en grilla del catálogo. Cero trabajo de catálogo.
      **Riesgos:** la lógica de arrastre sobre troncos (el jugador hereda la
      velocidad del tronco) es el punto fino; el temporizador **no cabe en el
      HUD** y hay que dibujarlo en el canvas; refuerza ARCADE **y** green, las
      dos dimensiones ya más pobladas.

- [ ] **MÓDULO LUNAR** (`modulo-lunar`) · yellow · esfuerzo **medio** · fila nueva · **#13**
      Aterrizaje de precisión: gravedad, inclinación, combustible finito,
      plataformas con multiplicador.
      **Score:** +100 × multiplicador por aterrizaje, **+1 por segundo en vuelo**
      (obligatorio para asegurar `score > 0`). **Vidas:** 3.
      **Ventaja:** reaprovecha la matemática vectorial de `AsteroidsGame.tsx`.
      **Riesgo:** **solape de sensación con Asteroids** — mismos controles de
      rotar + empujar, aunque el objetivo (posarse suave) sea el opuesto. El
      candidato con más riesgo de "esto ya lo jugué".

- [ ] **GLOTÓN** (`gloton`) · yellow · esfuerzo **ALTO** · **fila existe** · **#18**
      Pac-Man: laberinto, sprites, 4 fantasmas con IA de scatter/chase/frightened
      y personalidades distintas.
      **Encaje con el contrato: perfecto** — score, vidas y nivel salen solos, y
      su fila ya está escrita.
      **Único motivo de su puesto:** es un proyecto de **varias sesiones**, muy
      por encima del coste de cualquier otro candidato. Va al fondo por coste,
      **no por mérito**: es el juego grande a hacer cuando se quiera invertir.

## ⚔️ Colisiones a resolver

Dos pares del backlog son el mismo concepto propuesto desde dos categorías
distintas por pasadas paralelas. **Quédate con uno de cada par antes de escribir
ningún spec**, o se implementarán dos juegos que se sienten iguales.

| A                                        | B                                     | Concepto compartido                                   | Resolución recomendada                                                                                                                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tanques-neon` · SHOOTER · yellow · alto | `tanques` · VERSUS · magenta · medio  | Tanques en arena disparando                           | **Quedarse con `tanques`.** Son separables en teoría (`tanques-neon` es PvE de campaña con base que defender, `tanques` es duelo), pero `tanques-neon` es esfuerzo alto, su **salud de la base no cabe en el HUD**, y `tanques` brilla en 2P local.                     |
| `mortero-neon` · SHOOTER · green · bajo  | `artilleria` · VERSUS · green · medio | Artillería balística por turnos, terreno destructible | **Quedarse con `artilleria`.** Prácticamente el mismo juego; la única diferencia es si hay rival o dianas. El rival humano en 2P es lo que le da identidad, y los turnos encajan con alternarse el teclado. Si el criterio fuera solo el coste, ganaría `mortero-neon`. |

## ✅ Decisiones tomadas (2026-09-21)

- **2P local: SÍ.** Modo dos jugadores en el mismo teclado en los VERSUS, **sin
  tocar el esquema de `scores`** (sigue siendo un `player_name` + un `score` por
  fila). Regla definida: **se guarda siempre la puntuación del Jugador 1**
  (justificación en la ficha de `duelo-pixel`); el marcador del rival se dibuja
  **dentro del canvas**.
  _Efecto:_ revalida el `long` de `duelo-pixel`, que ya prometía 2P — la
  disonancia de copy detectada antes **desaparece**. Y abarata todo VERSUS: en
  2P la IA deja de ser obligatoria.
- **Juegos por turnos: SÍ se aceptan.** Al usuario no le importa el cambio de
  ritmo y acepta que el botón de pausa quede decorativo.
  _Efecto:_ `fusion-2048` y `artilleria` dejan de estar penalizados.
- **La tabla `games` SÍ puede crecer: SÍ a las filas nuevas.** Se añaden filas
  según se vayan implementando juegos.
  _Nota histórica:_ durante unas horas de esta misma sesión se trabajó con la
  premisa contraria (solo 4 slots, todo lo demás por sobrescritura). **Esa
  premisa era errónea y está deshecha.** Lo que sí queda del análisis: el
  procedimiento de sobrescribir una fila sigue siendo **posible y documentado**
  (migraciones `0002`/`0003`/`0005`, todas `update … where id`; nunca se ha
  hecho un `insert` de un juego nuevo después del seed) por si alguna vez
  conviene reciclar una fila en vez de añadir otra — con el aviso de FK del
  hallazgo 9.

## ✅ Implementados

- [x] **ARKANOID** (`arkanoid`) · ARCADE · cyan → `specs/08-juego-arkanoid.md`
- [x] **ASTEROIDS** (`asteroids`) · SHOOTER · yellow → `specs/05-juego-asteroides.md`
- [x] **SNAKE** (`snake`) · ARCADE · green → `specs/09-juego-snake.md`
- [x] **TETRIS** (`tetris`) · PUZZLE · magenta → `specs/07-juego-tetris.md`

## ❌ Descartados

_Ninguno todavía._ De los 18 conceptos evaluados el 2026-09-21 **no se descarta
ninguno**. Los dos perdedores de las colisiones (`tanques-neon`, `mortero-neon`)
quedan bloqueados por redundancia, no por falta de mérito.

---

## Estado del catálogo

Consultado en Supabase el 2026-09-21 (`select id, title, cat, color, playable
from public.games order by id;`). **Sin drift**: la tabla `games`, este archivo
e `references/implemented-games.md` coinciden exactamente.

| Categoría | Jugables        | Fila escrita sin implementar |
| --------- | --------------- | ---------------------------- |
| ARCADE    | arkanoid, snake | gloton, ranaria              |
| PUZZLE    | tetris          | —                            |
| SHOOTER   | asteroids       | invasores                    |
| VERSUS    | **ninguno**     | duelo-pixel                  |

| Color   | Jugables  |
| ------- | --------- |
| cyan    | arkanoid  |
| green   | snake     |
| magenta | tetris    |
| yellow  | asteroids |

Huecos visibles: **VERSUS no tiene ningún juego jugable** (de ahí el
recomendado) y PUZZLE solo tiene Tetris (de ahí el 2.º puesto). ARCADE está
sobrerrepresentada con 2 de 4. Los colores están equilibrados a 1 jugable cada
uno, así que el color es hoy un criterio de desempate, no de decisión.

### Fuentes disponibles

Verificado el 2026-09-21. Los tres templates de
`references/templates/started-games/` (`02-asteroids`, `03-tetris`,
`04-arkanoid`) **ya fueron portados**, y `references/templates/source-assets/`
solo contiene `snake-assets`, también consumido. **No queda ninguna fuente sin
usar**: todo candidato futuro se construye desde cero, así que "fuente
disponible" **ya no diferencia entre candidatos** y el peso se desplaza a huecos
de catálogo, solape y esfuerzo.

### Hallazgos técnicos que condicionan todo el backlog

Verificados en código el 2026-09-21. Léelos antes de redactar cualquier spec de
juego — varios son gotchas que no se deducen leyendo el contrato `forwardRef`.

1. **Las vidas deben quedarse entre 3 y 5.** `components/GamePlayer.tsx:105`
   pinta `{"♥ ".repeat(lives).trim() || "—"}`: 6 cúpulas o 10 vidas desbordan el
   HUD, y `0` se muestra como `—`.
2. **El HUD arranca en 3 vidas** (`GamePlayer.tsx:48`, `useState(3)`): un juego
   que **nunca** llame `onLivesChange` muestra **3 corazones falsos**.
3. **Gotcha obligatorio para juegos sin vidas:** `GamePlayer.restart()` resetea
   las vidas a 3 a ciegas. Hay que replicar el patrón `reportedLives = -1`
   documentado en `components/games/TetrisGame.tsx:378-381`, o ese 3 se queda
   pegado tras reiniciar. El precedente de `onLivesChange(0)` está en
   `TetrisGame.tsx:357`.
4. **No hay fallback de nivel para juegos reales** (`GamePlayer.tsx:56`): si el
   juego no llama `onLevelChange`, el HUD se queda clavado en `01` para siempre.
5. **Los `cover` son clases CSS pixel-art escritas a mano**, no imágenes: 8
   clases de juego en `app/globals.css` (líneas 669–854, más `cover-bg`).
   **Toda fila nueva arrastra escribir una clase `.cover-*` nueva** — coste real
   y universal ahora que el catálogo crece. Dato útil: las tres migraciones que
   sobrescribieron filas (`0002`/`0003`/`0005`) **no** cambiaron el `cover`, pero
   solo porque el arte sembrado ya encajaba con el juego final; no es un
   precedente de que el cover salga gratis.
6. **`scores.score > 0` es un check constraint**
   (`supabase/migrations/0001_create_games_and_scores.sql:17`) y `player_name`
   está limitado a 10 caracteres. Todo juego que pueda terminar en 0 necesita
   puntos de consolación.
7. **Fuentes agotadas** (ver arriba): "fuente disponible" ya no discrimina.
8. **Sin drift** al 2026-09-21. `references/implemented-games.md` está al día —
   **no lo toques**.
9. **Si alguna vez se sobrescribe una fila en vez de añadir una nueva**, cambiar
   la primary key **puede romper la FK `scores.game_id`**. Verificar antes que no
   haya puntuaciones para ese id
   (`select count(*) from scores where game_id = '<id>'`); el precedente y el
   procedimiento están en `specs/09-juego-snake.md` (riesgos + paso 1 del plan).
10. **El HUD asume un jugador.** Todo indicador extra — marcador del rival en 2P,
    temporizador, combustible, ángulo/potencia, salud de una base, cola de
    piezas — se dibuja **dentro del canvas**.
