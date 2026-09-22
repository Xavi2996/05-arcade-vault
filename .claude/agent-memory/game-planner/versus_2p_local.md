---
name: versus-2p-local-pattern
description: El usuario quiere 2P local en VERSUS sin tocar el esquema de scores — regla definida: se persiste siempre la puntuación del Jugador 1; marcador del rival dentro del canvas
metadata:
  type: project
---

**El usuario decidió el 2026-09-21 que SÍ quiere modo 2 jugadores en el mismo
teclado en los juegos VERSUS**, con una condición: **resolverlo sin tocar el
esquema de `scores`** (sigue siendo un `player_name` + un `score` por fila).

**Why:** quiere el modo social clásico de un arcade, pero sin refactor de datos.

**How to apply:** ya no hay que acotar los VERSUS a 1P vs CPU — eso era una
suposición mía anterior, **ya superada**. Al contrario: 2P local **baja el
esfuerzo** de todo el bloque VERSUS, porque calibrar una CPU era su parte más
cara y en 2P la IA deja de ser obligatoria. Sube a `tanques`, `artilleria` y
`estelas` en cualquier ranking futuro.

## Regla de persistencia definida (decisión de diseño mía, 2026-09-21)

**Se persiste siempre la puntuación del Jugador 1**, no la del ganador.

**Por qué:** `GamePlayer` pide **un solo** `player_name` en el modal de fin, y lo
teclea quien tiene el teclado. Si guardáramos "la del ganador" y ganara P2, el
ranking acreditaría a un nombre el rendimiento de otra persona — un registro que
miente. Con P1 la regla es determinista y sin ramas.

**HUD:** el de `GamePlayer` es de un jugador, así que **el marcador de P2 se
dibuja dentro del canvas**. Coherente con la regla: el HUD siempre muestra lo de
P1. Ver [[platform-game-contract]].

**Riesgo declarado y sin resolver:** un P2 complaciente permite inflar el score
de P1 sin límite, y esas entradas conviven con las de 1P vs CPU en el mismo
leaderboard. Alternativa si el usuario lo objeta: que el modo 2P **no guarde** y
quede como modo amistoso.

## Mapeo del HUD para VERSUS

Sigue valiendo, tanto en 1P vs CPU como en 2P: **vidas = puntos que te anota el
rival**, **nivel = dificultad de la CPU** (en 1P) o **número de set** (en 2P, no
hay rampa de dificultad).

Para no chocar con el check `scores.score > 0`, todo VERSUS necesita puntos de
consolación (p. ej. +1 por rebote, no solo por punto ganado). Ver
[[supabase-schema-constraints]].
