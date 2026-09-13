# SPEC 01 — MVP visual de Arcade Vault (pantallas sin juego)

> **Estado:** Aprobado
> **Depende de:** (ninguno)
> **Fecha:** 2026-09-11
> **Objetivo:** Implementar como rutas reales de Next.js todas las pantallas visuales de Arcade Vault (biblioteca, detalle, reproductor, acceso y salón de la fama) descritas en `references/templates/`, sin implementar ningún juego real.

## Scope

**In:**

- **Biblioteca** (`/`): hero, buscador por nombre, filtro por categoría (chips), grid de tarjetas de juego con efecto tilt 3D al hover — migrado de `references/templates/biblioteca.jsx`.
- **Detalle** (`/juegos/[id]`): portada, tags, descripción, franja de estadísticas (partidas / mejor puntuación / dificultad), leaderboard lateral con datos mock deterministas, botones "Jugar ahora" / "Volver al Vault" — migrado de `detalle.jsx`.
- **Reproductor** (`/juegos/[id]/jugar`): HUD (jugador, puntuación, vidas, nivel), arena tipo CRT animada solo con CSS (sin lógica real de juego), simulación de puntuación autoincremental falsa, pausa, modal de fin de partida con guardado de puntuación y reinicio — migrado de `reproductor.jsx`.
- **Acceso** (`/auth`): tabs "Iniciar sesión" / "Crear cuenta", formulario mock que guarda una sesión simulada, acceso como invitado, botones sociales decorativos — migrado de `auth.jsx`.
- **Salón de la fama** (`/salon-de-la-fama`): tabs por juego, podio top 3, tabla de ranking, fila destacada del usuario si hay sesión iniciada — migrado de `salon.jsx`.
- **Nav global**: logo, enlaces activos según la ruta actual, contador de créditos estático, botón de acceso/cierre de sesión, menú hamburguesa responsive — migrado de `nav.jsx`, adaptado a `usePathname`/`next/link`.
- Catálogo de 8 juegos y generador determinista de puntuaciones mock, migrados de `data.jsx`.
- Sesión de usuario mock persistida en `localStorage`, leída y escrita desde el Nav y desde Auth.
- Página 404 cuando `/juegos/[id]` recibe un id que no existe en el catálogo.

**Out of scope (para futuros specs):**

- Cualquier lógica real de juego (colisiones, físicas, input de teclado/táctil real, puntuación real).
- Backend o API real, autenticación real u OAuth funcional (los botones de Google/GitHub son decorativos).
- Una tabla de puntuaciones real alimentada por partidas jugadas — el guardado de puntuación en el reproductor queda inerte, igual que en el prototipo.
- Sistema de créditos/monedas funcional.
- Tests automatizados (el repo no tiene test runner configurado todavía).
- Internacionalización o soporte multi-idioma.

## Data model

```ts
// data/games.ts
interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // clase CSS de portada (cover-bricks, cover-tetro, ...)
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}
export const GAMES: Game[];
export const CATS: string[]; // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
```

```ts
// data/mock-scores.ts
interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // dd/mm/2026
}
export const PLAYERS: string[];
export function seededScores(seed: number, count?: number): ScoreRow[];
```

Persistencia en `localStorage` (solo cliente, sin versionado — alcance MVP):

- `av_user`: `{ name: string } | null` — sesión mock, escrita por Auth y por el botón de invitado, leída por el Nav y por Salón de la fama.
- `av_scores`: array de `{ game: string, score: number, name: string, at: number }` — se agrega una entrada al guardar una puntuación en el reproductor. Ninguna pantalla la lee de vuelta (igual que el prototipo); solo confirma visualmente el flujo de guardado.

## Implementation plan

1. Crear `data/games.ts` y `data/mock-scores.ts` migrando el catálogo y el generador determinista desde `references/templates/data.jsx`.
2. Crear `components/Nav.tsx` (adaptación de `nav.jsx` con `usePathname`, `next/link` y lectura de `av_user`) e integrarlo en `app/layout.tsx` junto con el footer que ya existía en `app.jsx`.
3. Crear `components/GameCard.tsx` (tarjeta con tilt 3D) y reescribir `app/page.tsx` como la Biblioteca completa (hero + buscador + chips + grid), filtrando `GAMES` en cliente.
4. Crear `app/juegos/[id]/page.tsx` (Detalle) con `params` async, `notFound()` si el id no existe en `GAMES`, y leaderboard vía `seededScores`.
5. Crear `app/juegos/[id]/jugar/page.tsx` (Reproductor) como client component: HUD, arena CRT animada, simulación de puntuación, pausa, modal de fin de partida con guardado en `av_scores` y reinicio.
6. Crear `app/auth/page.tsx` (Acceso) con tabs, formulario mock que escribe `av_user`, invitado y botones sociales decorativos, redirigiendo a `/` tras enviar.
7. Crear `app/salon-de-la-fama/page.tsx` con tabs por juego, podio y tabla, mostrando la fila destacada del usuario solo si `av_user` existe.
8. Añadir manejo de 404 para `/juegos/[id]` con id inexistente (`not-found.tsx` de esa ruta o `notFound()` + `app/not-found.tsx` global).
9. Revisión final: recorrer manualmente las 5 pantallas y la navegación entre ellas en el navegador, y ejecutar `npm run lint` y `npm run build`.

## Acceptance criteria

- [ ] `npm run build` finaliza sin errores.
- [ ] `npm run lint` finaliza sin errores.
- [ ] La ruta `/` muestra el hero, el buscador filtra el grid por texto y los chips filtran por categoría.
- [ ] Cada tarjeta de juego navega a `/juegos/[id]` al hacer click.
- [ ] `/juegos/un-id-inexistente` muestra la página 404.
- [ ] `/juegos/[id]` muestra un leaderboard con 10 filas generadas de forma determinista para ese id.
- [ ] El botón "JUGAR AHORA" en el detalle navega a `/juegos/[id]/jugar`.
- [ ] En `/juegos/[id]/jugar` la puntuación sube sola cada ~220ms hasta pulsar Pausa o Fin.
- [ ] Pulsar Pausa detiene el incremento y muestra el overlay "EN PAUSA"; pulsar de nuevo reanuda.
- [ ] Pulsar Fin abre el modal de fin de partida con la puntuación final.
- [ ] Guardar la puntuación en el modal escribe una entrada nueva en `localStorage` bajo `av_scores` y muestra el toast "PUNTUACIÓN GUARDADA".
- [ ] En `/auth`, enviar el formulario de "Iniciar sesión" guarda un usuario en `localStorage` (`av_user`), redirige a `/` y el Nav muestra el nombre del usuario.
- [ ] "JUGAR COMO INVITADO" navega a `/` sin crear sesión.
- [ ] Cerrar sesión desde el Nav borra `av_user` y vuelve a mostrar el botón "Iniciar Sesión".
- [ ] `/salon-de-la-fama` muestra podio y tabla para cada juego seleccionado en las tabs, con fila destacada del usuario solo si hay sesión iniciada.
- [ ] El menú hamburguesa funciona en viewport móvil (<840px) igual que en el prototipo.

## Decisions

- **Sí:** rutas reales de Next.js App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon-de-la-fama`) en vez de hash-routing, para aprovechar `params` async, `next/link`/`next/navigation` y las convenciones ya usadas en el repo (`LayoutProps<'/'>`, etc.).
- **Sí:** reutilizar las clases CSS ya portadas en `app/globals.css` (`av-nav`, `card`, `chip`, `modal`, `hall-table`, etc.) en vez de reescribir la estética con utilidades Tailwind — ya replican fielmente el diseño del prototipo y `layout.tsx`/`page.tsx` ya las usan.
- **Sí:** sesión de usuario mock en `localStorage` (`av_user`), sin backend, porque el alcance es solo visual y el prototipo ya resuelve el flujo así.
- **Sí:** mantener `av_scores` como escritura inerte (se guarda pero no se lee en ninguna pantalla), igual que el prototipo, para no inventar una funcionalidad de "mis puntuaciones" que no fue pedida.
- **Sí:** los rankings siempre se generan con `seededScores()` (determinista por id), nunca con datos reales, porque no existe backend de partidas.
- **Sí:** componentes y datos mock en `components/` y `data/` en la raíz del repo, siguiendo la convención habitual del App Router.
- **Sí:** id de juego inexistente en `/juegos/[id]` muestra la página 404 estándar de Next.js (`notFound()`).
- **No:** implementar lógica de juego real (colisiones, físicas, input) — explícitamente fuera de alcance según el pedido del usuario.
- **No:** autenticación real u OAuth — los botones de Google/GitHub quedan decorativos, sin acción.
- **No:** tests automatizados — no hay test runner configurado en el repo todavía.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `localStorage` deshabilitado (modo privado del navegador) | La sesión simplemente no persiste entre recargas; la app sigue funcionando como invitado sin romperse. |
| Un id de juego se referencia mal en algún link interno | Los ids se centralizan en `data/games.ts` como fuente única de verdad para generar todos los enlaces (`/juegos/[id]`, `/juegos/[id]/jugar`). |

## Lo que **no** está en este spec

- Lógica real de juego (colisiones, físicas, input real) — cada juego del catálogo tendría su propio spec si se implementa.
- Backend, API real o autenticación real/OAuth.
- Tabla de puntuaciones reales alimentada por partidas jugadas.
- Sistema de créditos/monedas funcional.
- Tests automatizados.
- Internacionalización.
