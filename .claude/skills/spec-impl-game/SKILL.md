---
name: spec-impl-game
description: Implementa un spec de juego ya Aprobado reutilizando /spec-impl, y al terminar encadena el cierre completo (fila del catálogo, fichas de referencia, @agent-skin-designer y la implementación de las tres skins). Usa esto en vez de /spec-impl cuando el spec añada un juego jugable.
disable-model-invocation: true
argument-hint: <NN-spec-juego>
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Task, Agent, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(cat:*), Bash(ls:*), Bash(npm run lint:*), Bash(npm run build:*), Bash(date:*), mcp__supabase__execute_sql, mcp__supabase__apply_migration, mcp__supabase__list_tables
---

# /spec-impl-game — implementador de specs de juego, con cierre completo

Es `/spec-impl` **más** el cierre que un juego nuevo siempre necesita: catálogo en Supabase, fichas de
referencia, skins diseñadas por `@agent-skin-designer` y esas skins llevadas a código.

La implementación del spec **no se reimplementa aquí**: se delega literalmente en `/spec-impl`. Este
archivo solo añade una guarda al principio y una Fase 5 al final.

## Contexto de sesión

Estado del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe"`

Configuración de creación de rama:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, sin archivo de config)"`

Skins ya implementadas:
!`ls components/games/skins/ 2>/dev/null || echo "components/games/skins/ no existe todavia"`

Ficheros de referencia:
!`ls references/ 2>/dev/null || echo "references/ no existe"`

---

## Fase 0 — Guarda: ¿esto es un spec de juego?

El argumento recibido es: `$ARGUMENTS`

Antes de nada, localiza el spec en `specs/` (mismo criterio flexible que `/spec-impl`: nombre completo,
solo el número o solo el slug) y léelo por encima. Comprueba que **es un spec de juego**: menciona un `id`
de juego, un componente bajo `components/games/`, el registro `REAL_GAMES`, o una fila de la tabla `games`.

- Si lo es → sigue a la Fase 1.
- Si **no** lo parece → no continúes. Explica por qué y pregunta con `AskUserQuestion` si prefieren
  `/spec-impl` (el implementador genérico, sin Fase 5) o si insisten en este comando porque el spec sí
  añade un juego aunque no lo parezca. Espera la respuesta.

Si `$ARGUMENTS` viene vacío, no adivines: deja que la Fase 1 delegada haga su trabajo de pedir el nombre.

---

## Fases 1 a 4 — delegadas a `/spec-impl`

Lee `.claude/skills/spec-impl/SKILL.md` con la herramienta Read y **ejecuta sus Fases 1 a 4 al pie de la
letra**:

1. Identificar el spec.
2. Validar que el estado significa **Aprobado** (en cualquier idioma). Si no lo significa, muestra su
   mensaje de error estándar y **para**.
3. Crear y cambiar a la rama `spec-NN-slug` según `AutoCreateBranch`, comprobando antes el árbol de
   trabajo, y mostrar el resumen del spec.
4. Implementar paso a paso, con pausa y confirmación después de cada paso del plan.

Dos precisiones al delegar:

- Usa el **contexto de sesión de este archivo** (arriba), no el del suyo: es el mismo más dos líneas.
- **Todas sus reglas duras siguen vigentes**, en especial: nunca commitear automáticamente, implementar lo
  que el spec dice, y parar ante una ambigüedad en vez de improvisar.

**Si cualquiera de esas fases se detiene** —estado no aprobado, árbol sucio sin decisión del usuario,
ambigüedad sin resolver, un paso que el usuario no confirma— **detente igual tú**. No pases a la Fase 5.

Cuando `/spec-impl` llegaría a su mensaje de "todos los pasos implementados", no lo des por cerrado: en
este comando ahí empieza la Fase 5. Anúncialo:

```
✅ Todos los pasos del plan están implementados.

Ahora viene el cierre del juego (Fase 5): verificación, catálogo, fichas,
skins con @agent-skin-designer y su implementación. ¿Continúo?
```

Espera confirmación.

---

## Fase 5 — cierre encadenado

Estrictamente **secuencial**. Un bloque tras otro, nunca en paralelo, con un resumen breve entre bloques.
Sigue sin haber commits automáticos.

### 5.1 — Verificación

- Recorre los **criterios de aceptación** del spec uno a uno y di cuáles pasan y cuáles no.
- `npm run lint` y `npm run build`.
- Si algo falla, arréglalo antes de seguir. No maquilles el resultado: si un criterio no se cumple, dilo.

### 5.2 — Fila del catálogo en Supabase

- Con `mcp__supabase__execute_sql`, consulta si la fila del juego ya existe en `games`.
- Si el spec traía un `insert`/`update` de catálogo, aplícalo. Si el spec lo plantea como migración
  versionada (el patrón de `supabase/migrations/`), usa `mcp__supabase__apply_migration`; si es un ajuste
  suelto, `execute_sql` basta.
- El objetivo es la fila completa y `playable = true`.
- Confirma con un `select` posterior y enseña el resultado.

### 5.3 — `references/implemented-games.md`

**Va antes del agente de skins**, porque `skin-designer` rechaza cualquier juego que no aparezca aquí.

- Re-consulta la tabla `games` (no copies a mano lo que creas recordar) y añade la ficha del juego nuevo:
  id, categoría y color, descripción, controles, ruta del componente y spec de origen.
- Respeta el formato de las fichas que ya existen en el archivo.

### 5.4 — `@agent-skin-designer` — una sola invocación, en solitario

Prerrequisitos que debes verificar tú antes de lanzarlo:

- El `game.id` está en el registro `REAL_GAMES` de `components/GamePlayer.tsx`.
- El juego ya tiene ficha en `references/implemented-games.md` (paso 5.3).

Si algo de eso falta, arréglalo primero; el agente abortaría.

Lanza **un** subagente `skin-designer` pasándole el nombre del juego, **espera a que termine**, y no
lances ningún otro agente mientras corre. Una sola pasada: el agente ya diseña las tres skins
(`clasico`, `neon`, `retro`) de ese juego en una corrida.

Tú **no escribes** en `references/game-themes.md`: ese archivo es del agente. Si el juego ya tuviera ficha
ahí, dilo antes de lanzarlo — el agente actualiza, nunca duplica.

### 5.5 — Implementar las skins

Lee la ficha que el agente acaba de escribir en `references/game-themes.md` y llévala a código siguiendo
**exactamente** el patrón de los juegos que ya la tienen (`arkanoid`, `asteroids`, `snake`, `tetris`):

- `components/games/skins/<id>.ts` — una `SkinPalettes<T>` con la `T` que pida ese juego (la forma la
  decide el juego: ver el comentario de cabecera de `lib/skins.ts`).
- El componente del juego acepta `skin?: SkinId` y resuelve con `resolvePalette(palettes, skin)`. No debe
  quedar ni un color hardcodeado en el canvas.
- Añade el `game.id` al `Set` `GAMES_WITH_SKINS` de `components/GamePlayer.tsx`: eso enciende el selector
  del HUD y los `data-skin` / `data-game` de `.av-player` y `.crt`.
- **No dupliques nada de `lib/skins.ts`**: persistencia (`getSkin`/`setSkin`/`skinStorageKey` →
  `localStorage["av-skin-<id>"]`), ids, etiquetas y fallback a `clasico` ya están resueltos ahí.
- El glow va en CSS (`app/globals.css`), nunca dentro del canvas, y la skin `retro` no lleva glow.

Cierra con `npm run lint` y `npm run build` otra vez.

### 5.6 — Backlog

En `references/game-suggestions.todo.md`, mueve el juego de "próximo recomendado" a "implementados". Es lo
único que tocas de ese archivo: el resto lo mantiene `@agent-game-planner`.

### 5.7 — Cierre

Resume qué quedó hecho y qué queda en manos del usuario:

```
✅ Juego implementado y cerrado.

  Código       components/games/<Juego>Game.tsx + skins/<id>.ts, wireado en GamePlayer.tsx
  Catálogo     fila en `games` con playable = true
  Referencias  implemented-games.md, game-themes.md (por @agent-skin-designer),
               game-suggestions.todo.md
  Rama         spec-NN-slug  (sin commitear)

Te toca a ti: cambiar el estado del spec a "Implementado" y commitear/mergear la rama.
```

---

## Reglas duras

- **Nunca** commitees ni mergees automáticamente, ni por paso ni al final.
- **Un solo subagente a la vez.** Nunca `skin-designer` en paralelo consigo mismo ni con otro agente.
- No escribas en `references/game-themes.md`: es del `skin-designer`.
- No reescribas `references/game-suggestions.todo.md` más allá de mover el juego a "implementados".
- No toques `specs/.spec-config.yml`.
- No cambies el estado del spec por tu cuenta: eso lo hace el humano.
- Si una fase delegada se detiene, la Fase 5 no ocurre.

## Comportamiento esperado

```
/spec-impl-game 12-juego-frogger

  Fase 0    →  Confirma que el spec es de juego
  Fases 1-4 →  Delegadas a .claude/skills/spec-impl/SKILL.md
               (estado Aprobado → rama spec-12-juego-frogger → implementación por pasos)
  Fase 5    →  5.1 criterios + lint + build
               5.2 fila en `games`, playable = true
               5.3 references/implemented-games.md
               5.4 @agent-skin-designer frogger   ← una vez, en solitario, esperando a que termine
               5.5 components/games/skins/frogger.ts + GAMES_WITH_SKINS
               5.6 backlog → implementados
               5.7 resumen, sin commit

/spec-impl-game 03-about-contact   (no es un spec de juego)

  Fase 0    →  Avisa y ofrece /spec-impl. No crea rama, no toca código.
```
