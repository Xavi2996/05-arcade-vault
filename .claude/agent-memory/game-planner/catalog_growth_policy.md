---
name: catalog-growth-policy
description: La tabla games SÍ puede crecer con filas nuevas (usuario, 2026-09-21) — coste de una fila nueva, y el procedimiento de sobrescritura que sigue siendo posible pero ya no es obligatorio
metadata:
  type: project
---

**El usuario confirmó el 2026-09-21 que la tabla `games` puede crecer**: se
añaden filas nuevas según se vayan implementando juegos.

**Why:** no hay ninguna política de catálogo acotado. Lo dijo él directamente
tras corregir una respuesta anterior suya.

**How to apply:** **no asumas escasez de huecos.** Cualquier concepto puede
tener su propia fila; prioriza con la rúbrica normal (encaje duro, hueco de
categoría, solape, esfuerzo). Las 4 filas preexistentes (`duelo-pixel`,
`invasores`, `ranaria`, `gloton`) conservan una ventaja **modesta** — id,
título, `short`, `long` y `cover` ya escritos, cero trabajo de catálogo — pero
es un **desempate, no un filtro**.

## ⚠️ Corrección importante: hubo una premisa errónea

Durante unas horas del 2026-09-21 trabajé con la premisa contraria ("la tabla no
crece, solo hay 4 slots, todo lo demás por sobrescritura") y reestructuré el
TODO entero alrededor de ella, incluyendo una recomendación de **sacrificar el
slot de `gloton` por `fusion-2048`**. **Esa premisa era falsa y está deshecha:**
`fusion-2048` entra por fila nueva y `gloton` se queda en el backlog por su
propio mérito (va al fondo por esfuerzo alto, no por competir por un hueco).
Si encuentras rastros de "4 slots" en algún sitio, son basura: bórralos.

## Coste de una fila nueva

Un `insert` en `games`, escribir `short` y `long`, y **una clase `.cover-*` de
pixel-art nueva en `app/globals.css`** — los covers son CSS escrito a mano, no
imágenes. Ver [[platform-game-contract]]. Es real pero pequeño frente al juego.

## Sobrescribir una fila: posible, ya no obligatorio

Sigue siendo una opción válida si alguna vez conviene reciclar una fila.
Precedente real en `supabase/migrations/`: `0002` caida→tetris, `0003`
bloque-buster→arkanoid, `0005` serpentina→snake — los tres un
`update public.games … where id = '<viejo>'`, incluyendo el cambio de primary
key. **Nunca se ha hecho un `insert` de un juego nuevo después del seed
inicial**, así que la primera fila nueva estrenará ese camino.

Dos matices verificados que conviene no perder:

- Los tres `update` **no** cambiaron el `cover`, pero solo porque el arte
  sembrado ya encajaba con el juego final. **No es precedente de que el cover
  salga gratis.**
- **Gotcha de FK:** cambiar el `id` rompe `scores.game_id` si ya hay
  puntuaciones para ese id. Verificar antes con
  `select count(*) from scores where game_id = '<id>'`; procedimiento en
  `specs/09-juego-snake.md`. Ver [[supabase-schema-constraints]].
- Sobrescribir permite cambiar también `cat` y `color` (son enums con check
  constraint, no claves).
