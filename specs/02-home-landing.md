# SPEC 02 — Home / Landing page de Arcade Vault

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-14
> **Objetivo:** Migrar `home.jsx` de `references/templates/home-about/` como la nueva ruta raíz `/` (landing de marketing), moviendo la Biblioteca actual (SPEC 01) a `/biblioteca` y actualizando todos los enlaces internos afectados.

## Scope

**In:**

- **Home / Landing (`/`)**: hero con siluetas pixel flotantes decorativas, sección "¿Por qué Arcade Vault?" (feature grid de 4 tarjetas), preview de 6 juegos (`GAMES.slice(0, 6)`), sección de stats, sección "Actividad en vivo" (ticker de últimas puntuaciones + top 5 jugadores de hoy), sección de precios (plan único gratis + FAQ), CTA final — migrado de `references/templates/home-about/home.jsx`.
- Animación "reveal on scroll" (`IntersectionObserver` vía hook `useReveal`) para las secciones marcadas `.reveal`, igual que en el prototipo.
- **Reubicación de la Biblioteca**: el contenido actual de `app/page.tsx` (hero de biblioteca, buscador, chips, grid con tilt 3D — SPEC 01) se mueve a `app/biblioteca/page.tsx` sin cambios funcionales.
- **Nav actualizado**: se agrega el enlace "Inicio" apuntando a `/` (antes de "Biblioteca"), y el enlace que hoy dice "Biblioteca" pasa a apuntar a `/biblioteca` — migrado de `references/templates/home-about/nav.jsx`, conservando el resto de la lógica ya existente en `components/Nav.tsx` (sesión mock, estado activo por `pathname`, menú hamburguesa).
- **Actualización de enlaces internos** que hoy apuntan a `/` con la intención de "volver a la biblioteca de juegos" (no al home): botón "VOLVER AL VAULT" en `components/GamePlayer.tsx` y en `app/juegos/[id]/page.tsx`, y las redirecciones `router.push("/")` en `app/auth/page.tsx` — todos pasan a apuntar a `/biblioteca`.
- Migración a `app/globals.css` de las reglas CSS nuevas que `home.jsx` necesita y que no existen todavía en el proyecto (`.home`, `.home-hero`, `.home-silos`/`.silo`, `.feature-grid`/`.feature-card`, `.mini-rail`/`.mini-card`, `.home-stats`/`.stat-block`, `.activity-grid`/`.ticker`/`.top-list`, `.pricing-grid`/`.price-card`/`.faq-item`, `.home-final`, `.reveal`/`.reveal.in`), tomadas de `references/templates/home-about/styles.css`.

**Out of scope (para futuros specs):**

- **Página "Acerca de" (`about.jsx`)**, incluyendo el formulario de contacto mock — queda para un spec aparte.
- Cualquier dato dinámico real para el ticker de actividad o el top de jugadores: se copian tal cual del prototipo (nombres y puntajes fijos), sin usar `seededScores()` ni ningún backend.
- Cambios de contenido/funcionalidad dentro de la Biblioteca migrada — solo cambia su ruta (`/` → `/biblioteca`), no su implementación.
- Sistema de créditos/monedas funcional (el contador de créditos en el Nav sigue siendo estático).
- Tests automatizados (el repo no tiene test runner configurado todavía).

## Data model

No se introduce ningún modelo de datos nuevo. La sección de preview de juegos reutiliza `GAMES` de `data/games.ts` (SPEC 01). Los arrays del ticker de "últimas puntuaciones" y del "top jugadores de hoy" se copian literales dentro del componente de Home (mismos nombres y puntajes que `home.jsx`), como contenido de marketing estático — no son un módulo de datos compartido ni usan `seededScores()`.

## Implementation plan

1. Mover `app/page.tsx` (Biblioteca actual, SPEC 01) a `app/biblioteca/page.tsx` sin modificar su contenido.
2. Crear el nuevo `app/page.tsx` (Home) como client component, migrando `home.jsx`: hero con `FloatingSilhouettes`, hook `useReveal`, secciones "¿Por qué Arcade Vault?", preview de juegos (`MiniCard` + `GAMES.slice(0, 6)`), stats, actividad en vivo, precios/FAQ y CTA final. Los `navigate({...})` del prototipo se traducen a `next/link` (`/biblioteca`, `/auth`, `/juegos/[id]`, `/salon-de-la-fama`).
3. Añadir a `app/globals.css` las reglas CSS nuevas necesarias para Home (`.home*`, `.silo`/`.s1`–`.s8`, `.feature-*`, `.mini-*`, `.stat-*`, `.activity-*`/`.ticker`/`.tick-row`/`.top-*`, `.pricing-*`/`.price-card`/`.faq-*`, `.home-final`, `.reveal`/`.reveal.in`), tomadas de `references/templates/home-about/styles.css`, sin duplicar reglas ya existentes.
4. Actualizar `components/Nav.tsx`: agregar el enlace "Inicio" → `/` como primer enlace (desktop y menú móvil), y cambiar el enlace "Biblioteca" para que apunte a `/biblioteca` en vez de `/`. El logo sigue apuntando a `/`. Ajustar el estado activo (`libraryActive`) para que compare contra `/biblioteca` (y `/juegos`) en vez de `/`.
5. Actualizar los enlaces "VOLVER AL VAULT" en `components/GamePlayer.tsx` y `app/juegos/[id]/page.tsx` para que apunten a `/biblioteca` en vez de `/`.
6. Actualizar las redirecciones `router.push("/")` en `app/auth/page.tsx` (login y registro) para que apunten a `/biblioteca`.
7. Revisión final: recorrer manualmente `/` (landing, scroll-reveal, todos los CTAs) y `/biblioteca` (que siga funcionando igual que antes) en el navegador, y ejecutar `npm run lint` y `npm run build`.

## Acceptance criteria

- [ ] `npm run build` finaliza sin errores.
- [ ] `npm run lint` finaliza sin errores.
- [ ] La ruta `/` muestra la landing (hero, por qué Arcade Vault, preview de juegos, stats, actividad en vivo, precios, CTA final) en vez del grid de biblioteca.
- [ ] La ruta `/biblioteca` muestra exactamente lo que antes mostraba `/` (hero de biblioteca, buscador, chips, grid con tilt 3D), sin regresiones.
- [ ] Las secciones marcadas como `reveal` en `/` aparecen con la animación de entrada al hacer scroll hasta ellas.
- [ ] En el Nav, "Inicio" navega a `/` y queda marcado como activo únicamente en `/`; "Biblioteca" navega a `/biblioteca` y queda marcado como activo en `/biblioteca` y en `/juegos/*`.
- [ ] En el home, "EXPLORAR JUEGOS" y "VER TODOS LOS JUEGOS →" y "INSERTAR MONEDA →" navegan a `/biblioteca`.
- [ ] En el home, "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`.
- [ ] Cada `MiniCard` de la preview de juegos navega a `/juegos/[id]` del juego correspondiente.
- [ ] "VER SALÓN →" en la tarjeta de actividad navega a `/salon-de-la-fama`.
- [ ] "VOLVER AL VAULT" (en el reproductor y en el detalle de juego) navega a `/biblioteca`.
- [ ] Tras iniciar sesión o crear cuenta en `/auth`, la redirección lleva a `/biblioteca` (no a `/`).
- [ ] El menú hamburguesa móvil incluye "Inicio" y sigue funcionando en viewport <840px.

## Decisions

- **Sí:** `/` pasa a ser la landing (Home) y la Biblioteca se reubica en `/biblioteca`, siguiendo el patrón real de `references/templates/home-about/nav.jsx`, que trata "Inicio" y "Biblioteca" como rutas distintas.
- **Sí:** el alcance de este spec es solo `home.jsx` — `about.jsx` (con su formulario de contacto) queda fuera y se implementará en un spec posterior.
- **Sí:** el ticker de actividad y el top de jugadores del home se copian literales del prototipo (mismos nombres/puntajes fijos), sin usar `seededScores()`, porque son contenido de marketing estático, no un ranking real.
- **Sí:** todos los enlaces que hoy apuntan a `/` con intención de "volver a jugar/al catálogo" (VOLVER AL VAULT, redirecciones de `/auth`) se actualizan a `/biblioteca`, porque semánticamente apuntaban a la biblioteca, no a la nueva landing.
- **No:** no se toca el contenido ni la lógica de la Biblioteca migrada — solo cambia de ruta.
- **No:** no se agrega ninguna fuente de datos nueva (`data/`) para el ticker o el top de jugadores — se mantienen como arrays literales dentro del componente, igual que en el prototipo.

## Risks

| Riesgo                                                                                              | Mitigación                                                                                                                                             |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Algún enlace interno queda apuntando a `/` cuando debería ir a `/biblioteca` (regresión silenciosa) | El paso 7 incluye una revisión manual explícita de navegación cruzada entre `/`, `/biblioteca` y el resto de rutas antes de dar el spec por terminado. |
| Las reglas CSS nuevas de `home.jsx` colisionan con clases ya existentes en `globals.css`            | Se revisan nombres de clase contra `globals.css` antes de copiarlas (paso 3), evitando duplicados o sobreescritura accidental.                         |

## Lo que **no** está en este spec

- La página "Acerca de" (`about.jsx`) y su formulario de contacto.
- Cualquier dato real (backend) para el ticker de actividad o el ranking de jugadores del home.
- Cambios funcionales a la Biblioteca, más allá de su nueva ruta.
- Tests automatizados.
