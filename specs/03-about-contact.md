# SPEC 03 — Página "Acerca de" y formulario de contacto por correo

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-15
> **Objetivo:** Implementar la página "Acerca de" (`/acerca-de`) migrada de `references/templates/home-about/about.jsx`, incluyendo un formulario de contacto funcional que envía el mensaje por correo electrónico mediante Resend a través de una API route.

## Scope

**In:**

- **Página "Acerca de" (`/acerca-de`)**: hero con misión, fila de 3 highlights con iconos pixel (`HighlightIcon`), divisor animado (`reveal`), y sección de contacto (intro + tips + formulario) — migrado de `references/templates/home-about/about.jsx`.
- **Formulario de contacto**: validación de cliente ya existente en el prototipo (campos no vacíos, animación `shake` si faltan), que ahora hace `POST` a `/api/contact` en vez de simular el envío localmente.
- **API route `app/api/contact/route.ts`**: valida el payload en servidor (nombre y mensaje no vacíos, email con formato válido, campo honeypot vacío) y envía el correo usando Resend.
- **Integración con Resend**: se agrega la dependencia `resend`, un cliente en `lib/resend.ts`, y las variables de entorno `RESEND_API_KEY` (secreta, solo servidor) y `CONTACT_TO_EMAIL` (destino de los mensajes, valor por defecto `xavier.cobos.29@gmail.com`). Remitente: `onboarding@resend.dev` (dominio sandbox de Resend, sin dominio propio verificado). El correo se envía con `reply_to` apuntando al email del remitente del formulario.
- **Estado de éxito**: se conserva el bloque `terminal-success` del prototipo, mostrado tras una respuesta exitosa de `/api/contact`.
- **Estado de error (nuevo, no existe en el prototipo)**: si la llamada a `/api/contact` falla o responde `ok: false`, se muestra un bloque de error con estética consistente (variante del terminal), sin borrar los valores ya escritos, permitiendo reintentar el envío.
- **Honeypot anti-spam**: campo oculto adicional en el formulario; si llega con contenido, la API route descarta el envío silenciosamente y responde como si hubiera tenido éxito.
- **Nav actualizado**: se agrega el enlace "Acerca de" → `/acerca-de` en `components/Nav.tsx` (desktop y menú móvil), con estado activo cuando `pathname === "/acerca-de"` — este enlace había quedado pendiente en SPEC 02.
- **CSS**: migración a `app/globals.css` de las reglas de `about.jsx` (`.about*`, `.highlight*`, `.about-divider`, `.div-bar`, `.div-pixels`, `.about-contact`, `.contact-*`, `.terminal-success`, `.term-*`) desde `references/templates/home-about/styles.css`, más una variante nueva para el estado de error (ej. `.terminal-error`).
- **Configuración de entorno**: se crea `.env.example` documentando `RESEND_API_KEY` y `CONTACT_TO_EMAIL`; el valor real de `RESEND_API_KEY` se coloca en `.env.local` (no versionado).

**Out of scope (para futuros specs):**

- CAPTCHA o rate limiting — el honeypot es la única mitigación anti-spam de este spec.
- Dominio propio verificado en Resend — se usa el remitente sandbox `onboarding@resend.dev`.
- Persistencia de los mensajes enviados (base de datos, `localStorage` o archivo) — el mensaje solo se envía por correo, no se guarda registro.
- Panel de administración o listado de mensajes recibidos.
- Tests automatizados (el repo no tiene test runner configurado todavía).

## Data model

No se introduce un modelo de datos persistente (no hay base de datos ni `localStorage` nuevo). Se define el contrato de la API route:

```ts
// app/api/contact/route.ts
interface ContactPayload {
  name: string;
  email: string;
  message: string;
  company?: string; // honeypot: debe llegar vacío
}

type ContactResponse = { ok: true } | { ok: false; error: string };
```

Variables de entorno:

```
RESEND_API_KEY=          # secreta, solo servidor, en .env.local (no versionado)
CONTACT_TO_EMAIL=xavier.cobos.29@gmail.com   # destino de los mensajes, puede sobreescribirse en .env.local
```

## Implementation plan

1. Ejecutar `npm install resend`; crear `.env.example` documentando `RESEND_API_KEY` y `CONTACT_TO_EMAIL`, y agregar los valores reales a `.env.local` (gitignored).
2. Crear `lib/resend.ts` con el cliente de Resend inicializado a partir de `RESEND_API_KEY`.
3. Crear `app/api/contact/route.ts` (`POST`): valida el payload (nombre y mensaje no vacíos, email con formato válido vía regex simple, `company` vacío), descarta silenciosamente si el honeypot viene lleno (responde `{ ok: true }` sin llamar a Resend), y si pasa validación llama a `resend.emails.send` con `from: "onboarding@resend.dev"`, `to: process.env.CONTACT_TO_EMAIL`, `reply_to: email`, y el nombre/mensaje en el cuerpo. Responde `400` si la validación falla y `502` si Resend devuelve error.
4. Crear `app/acerca-de/page.tsx` como client component migrando `about.jsx`: hero, `highlight-row` con `HighlightIcon`, divisor `reveal` (reutilizando el hook `useReveal` ya existente para Home o replicando el mismo `IntersectionObserver`), y la sección de contacto con el formulario controlado (incluye el campo honeypot oculto).
5. Implementar en el formulario el nuevo estado de error: si el `fetch` a `/api/contact` falla o responde `ok: false`, mostrar el bloque de error (estilo terminal, clase `.terminal-error` nueva) sin limpiar `form`, permitiendo reintentar; si responde `ok: true`, mostrar el `terminal-success` existente.
6. Añadir a `app/globals.css` las reglas CSS de `about.jsx` tomadas de `references/templates/home-about/styles.css` (`.about*`, `.highlight*`, `.about-divider`, `.div-*`, `.about-contact`, `.contact-*`, `.terminal-success`, `.term-*`), más la variante `.terminal-error` para el paso 5, sin duplicar reglas ya existentes.
7. Actualizar `components/Nav.tsx`: agregar el enlace "Acerca de" → `/acerca-de` en `.links` (desktop) y en el panel móvil, con estado activo (`aboutActive = pathname === "/acerca-de"`).
8. Revisión final: probar el formulario end-to-end (envío exitoso llega a `CONTACT_TO_EMAIL` con `reply_to` correcto, un error simulado —p. ej. `RESEND_API_KEY` inválida— muestra el estado de error y permite reintentar, el honeypot descarta el envío sin generar correo), y ejecutar `npm run lint` y `npm run build`.

## Acceptance criteria

- [ ] `npm run build` finaliza sin errores.
- [ ] `npm run lint` finaliza sin errores.
- [ ] La ruta `/acerca-de` muestra el hero, la fila de highlights, el divisor animado y la sección de contacto.
- [ ] El Nav muestra "Acerca de" apuntando a `/acerca-de`, marcado activo solo en esa ruta, tanto en desktop como en el menú móvil.
- [ ] Enviar el formulario con nombre, correo y mensaje válidos dispara un `POST` a `/api/contact` y, si Resend responde OK, el correo llega a `CONTACT_TO_EMAIL` con esos datos y `reply-to` configurado al correo del remitente.
- [ ] Tras un envío exitoso se muestra el estado `terminal-success` con el nombre del remitente, igual que en el prototipo.
- [ ] Si `/api/contact` responde con error (simulado), el formulario muestra el nuevo estado de error y conserva los valores escritos, permitiendo reintentar sin perder la información.
- [ ] Enviar el formulario con campos vacíos activa la animación `shake` existente y no llega a llamar a `/api/contact`.
- [ ] Un envío con el campo honeypot lleno (simulado) no genera ningún correo y la API responde como si hubiera tenido éxito.
- [ ] Un email con formato inválido es rechazado por la API route con status `400` antes de llamar a Resend.
- [ ] `RESEND_API_KEY` no está hardcodeada en el código ni versionada — se lee desde variables de entorno, y `.env.example` documenta las variables requeridas.

## Decisions

- **Sí:** ruta `/acerca-de` en español, siguiendo la convención ya usada (`/biblioteca`, `/salon-de-la-fama`).
- **Sí:** se agrega el enlace "Acerca de" al Nav en este spec, ya que SPEC 02 lo había dejado pendiente explícitamente hasta que existiera la página.
- **Sí:** Resend como proveedor de envío de correo, con `onboarding@resend.dev` como remitente sandbox, sin dominio propio verificado por ahora.
- **Sí:** el correo de contacto llega a `xavier.cobos.29@gmail.com` por defecto, configurable vía la variable de entorno `CONTACT_TO_EMAIL` sin tocar código.
- **Sí:** se agrega una API route server-side (`/api/contact`) porque `RESEND_API_KEY` es secreta y no puede usarse desde un client component.
- **Sí:** validación server-side de formato de email y campos no vacíos, además de la validación de cliente ya existente en el prototipo.
- **Sí:** honeypot simple como única protección anti-spam, por ser de bajo esfuerzo, sin dependencias externas ni impacto en la UX.
- **Sí:** se agrega un estado de error nuevo (no existe en el prototipo original), porque el prototipo solo contempla el camino feliz y aquí el envío es real.
- **No:** no se persiste ningún registro de los mensajes enviados (ni `localStorage` ni backend) — solo se envían por correo, igual que pide el alcance original.
- **No:** no se agrega CAPTCHA ni rate limiting — desproporcionado para el tamaño actual del sitio.
- **No:** no se usa un dominio propio verificado en Resend — queda como mejora futura cuando exista un dominio.

## Risks

| Riesgo                                                                                                     | Mitigación                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` no configurada en el entorno de despliegue                                                | La API route valida su presencia y responde `500` con un mensaje claro en vez de fallar silenciosamente; `.env.example` documenta la variable. |
| El remitente sandbox `onboarding@resend.dev` puede caer en spam o tener límites de envío del plan gratuito | Aceptado como limitación conocida del MVP; migrar a dominio propio verificado queda para un ajuste futuro.                                     |
| El honeypot no detiene bots sofisticados                                                                   | Se acepta como mitigación proporcional al riesgo actual (sitio sin backend de usuarios reales todavía); no se invierte en CAPTCHA por ahora.   |

## Lo que **no** está en este spec

- CAPTCHA, rate limiting o cualquier protección anti-spam más allá del honeypot.
- Dominio propio verificado en Resend.
- Persistencia de los mensajes de contacto enviados.
- Panel de administración de mensajes.
- Tests automatizados.
