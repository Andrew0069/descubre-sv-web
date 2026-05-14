# Destino SV App — Instrucciones para Agentes de AI

## Stack
- Frontend: React + Vite
- Backend: Supabase (base de datos, auth, storage)
- Estilos: CSS propio
- Routing: React Router

## Estructura principal
- `src/pages/` — vistas principales
- `src/components/` — componentes reutilizables
- `src/services/` — queries a Supabase (favoritosService, lugaresService, etc.)
- `src/lib/` — utilidades, contextos, validaciones

## Registro de sesiones (OBLIGATORIO)

Al **finalizar cada sesión**, actualiza el archivo `session-log.json` en la raíz del proyecto agregando una nueva entrada al array `sessions` con este formato:

```json
{
  "id": <número correlativo>,
  "date": "<fecha en formato YYYY-MM-DD>",
  "ai_tool": "<nombre de la herramienta AI usada>",
  "summary": "<resumen breve de lo que se hizo en la sesión>",
  "files_modified": ["<lista de archivos modificados>"],
  "changes": [
    "<cambio 1>",
    "<cambio 2>"
  ]
}
```

## Resumen de sesiones recientes

### 2026-05-14 - Claude Code Opus 4.7 (sesión 58)
- **Restyle estético completo del Admin Lugares (sinergia con Home/Main):**
  - Archivos: `src/index.css` (nuevo bloque `.admin-*`), `src/pages/AdminPage.jsx` (solo sección lugares), `src/components/EditLugarForm.jsx`, `src/components/NewLugarForm.jsx`. Cero cambios de lógica — handlers, estados, RLS, queries Supabase y firmas de componentes intactos.
  - **Paleta heredada del `.traveler-panel` (sesión 57):** fondo crema `linear-gradient(180deg, #fffdf5, #fff8e8)`, borde amarillo `rgba(245,200,66,0.30)`, sombra cálida `0 18px 44px rgba(120,85,0,0.10)`. CTAs primarios con gradiente amarillo→magenta `linear-gradient(135deg, #f59e0b, #ec4899)` y sombra rosa `0 8px 20px rgba(236,72,153,0.32)` (Airbnb-like).
  - **Topbar + sidebar:** `.admin-page` con fondo crema; `.admin-topbar` con título cálido `#241808` y subtítulo `#9a8a6b`; "← Volver al sitio" → `.admin-pill-secondary`. `.admin-sidebar` (radius 18px, sticky); tabs de sección → pills `.admin-tab` con `.is-active` gradient; "+ Nuevo lugar" → `.admin-cta-primary` (gradient full-width). Lista de lugares → `.admin-place-row` con `.is-active` (barra izquierda 3px amarilla + tinte gradient suave).
  - **Panel principal:** `.admin-panel` (radius 22px + animación `adminFadeUp` 0.32s). Header con `.admin-eyebrow`/`.admin-title`/`.admin-subtitle`; chip "N fotos" → `.admin-chip` (pill amarillo); botón Eliminar → `.admin-pill-danger` (pill rojo con hover-lift). Empty state → `.admin-empty` (dashed amarillo).
  - **Galería:** `.admin-gallery` con header tinte crema; "+ Subir foto" en CTA gradient; cards `.admin-photo-card` con `adminFadeUp` escalonada vía `--i` por índice, hover `translateY(-2px) scale(1.01)`; portada con `.is-cover` (ring verde + glow); botones reorder/delete/hacer-portada aparecen en opacity 0→1 al hover/focus.
  - **Horarios:** `.admin-hours-row` con hover crema; toggle Abierto/Cerrado como pill verde `.is-on`; inputs time `.admin-time-input` con focus ring amarillo `0 0 0 3px rgba(245,158,11,0.18)`; "Guardar horarios" en CTA gradient.
  - **EditLugarForm + NewLugarForm:** eliminados `fieldStyle`/`labelStyle`/`createFieldStyle`/`createLabelStyle`; ahora usan `.admin-form-card/__header/__body/__footer/__extra`, `.admin-form-field` con focus ring amarillo, `.admin-form-toggle` con switch gradient amarillo→magenta cuando `.is-on`.
  - **Responsive ≤640px:** `.admin-layout` colapsa a 1fr, sidebar pierde sticky, grid de galería pasa a `minmax(140px, 1fr)`, padding del panel a 1.1rem.
  - **Fuera de scope:** tabs `usuarios`/`resenas`/`sugerencias`/`logs` no se tocan (siguen con apariencia gris/azul). Vite build: 119 módulos sin errores nuevos.

### 2026-05-14 - Claude Code Opus 4.7 (sesión 57)
- **Restyle Airbnb del LugarTravelerPanel + fix responsive mobile:**
  - `src/index.css` — único archivo tocado; el JSX de `LugarTravelerPanel.jsx` queda intacto.
  - **Estilo (desktop + mobile):** `.traveler-panel` con gradiente amarillo saturado `linear-gradient(135deg, #fff4c2 0%, #fde68a 55%, #fcd34d 100%)`, `border-radius: 22px` y sombra `0 18px 44px rgba(120,85,0,0.14)`.
  - **Tabs como pills:** `.traveler-tab` con `border-radius: 999px` y fondo blanco; estado activo `.traveler-tab.is-active` con gradiente vibrante amarillo → magenta `linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)`, texto blanco y sombra rosa (`0 8px 20px rgba(236,72,153,0.32)`) — emula el botón "Reservar" de Airbnb.
  - `.traveler-bar-fill` actualizado a gradiente tri-stop amarillo → naranja → magenta. Cards con fondo blanco puro sobre el panel amarillo. Chips con saturación subida (`#fff3c4`, `#fcd34d`, `#fbbf24`).
  - **Fix mobile (`@media (max-width: 640px)`):** tabs ahora `flex:1 1 auto; min-width:0` — los 4 caben sin scroll horizontal en pantallas ~360px. Padding del panel 14px, title 1.1rem, description 0.86rem, cards 14px padding / 14px radius, chips 6/9px, range 1.05rem. Todo el bloque vive dentro del media query → desktop ≥641px queda idéntico.
  - Validado con `npm run build` sin errores nuevos.

### 2026-05-13 - Claude Code Sonnet 4.6 (sesiones 52–54)
- **Home top 10 + Fix bloqueo de usuarios en Admin:**
  - `Home.jsx`: el memo `filtrados` ahora limita a 10 lugares cuando no hay filtros activos, ordenados por score (`destacado + favoritos_count×2 + promedio_rating×10`). Con cualquier filtro activo se muestra la lista completa sin límite.
  - **Fix RLS**: la tabla `usuarios` no tenía política UPDATE para admins — `bloquearUsuario`/`desbloquearUsuario` eran silenciosamente ignoradas por Supabase. Migración `admin_block_users_policy_and_rpc` agrega política `"Admin puede actualizar usuarios"` (UPDATE para `authenticated` donde `is_admin=true`).
  - **Fix RPC**: `resetear_intentos` solo permitía que el propio usuario reseteara sus intentos; se creó `admin_resetear_intentos(p_user_id uuid)` con `SECURITY DEFINER` que valida `is_admin` del caller y resetea por `id` interno.
  - `usuariosService.js`: `resetearIntentosUsuario` apunta a `admin_resetear_intentos` en lugar de `resetear_intentos`.

### 2026-05-12 - Claude Code Sonnet 4.6 (sesiones 43–47)
- **Fix viewer de guías + mejora sistema de notificaciones (Toast):**
  - `Guias.jsx`: reemplazado iframe de Google Maps (bloqueado sin API key) por botón "Abrir ruta en Google Maps" (`target=_blank`). Colores del viewer cambiados de oscuro a crema/blanco+amarillo de la app; botón "← Volver" con estilo estándar (`#f3f4f6`).
  - `src/components/Toast.jsx`: nuevo componente compartido — `position:fixed` top-center, fondo crema `#fffbeb`, borde izquierdo amarillo `#F5C842`, icono circular, animación spring entrada (`toastSlideDown`) + fade salida (`toastSlideUp`). Detección automática de tipo (error/success/warning/info) por contenido del mensaje.
  - `App.jsx`: keyframes `toastSlideDown` y `toastSlideUp` agregados globalmente.
  - `Home.jsx`, `DetalleLugar.jsx`, `AdminPage.jsx`, `Guias.jsx`: reemplazados todos los renders inline de toast oscuro con `<Toast msg={toast} />`.
  - **Fix scroll**: `Toast.jsx` usa `createPortal(..., document.body)` — escapar del div `.page-fadeIn` que tiene `transform:translateY(0)` (containing block) rompía `position:fixed`; ahora el toast siempre aparece en el top del viewport real.

### 2026-05-12 - Claude Code Sonnet 4.6 (Thinking) (sesión 46)
- **Página de Notificaciones estilo Facebook:**
  - `src/pages/Notificaciones.jsx`: nueva página en `/notificaciones` con header sticky, botón `← Volver` (usa `navigate(-1)`), tabs "Todas"/"No leídas" con acento amarillo `#F5A623`, agrupación temporal "Hoy"/"Anteriores", animaciones `fadeIn` por sección.
  - `NotifItem`: card con borde crema, hover con elevación `translateY(-1px)`, avatar con badge de tipo (comentario/like/sugerencia), punto amarillo para no leídas, botón descartar `×` con `stopPropagation`.
  - Al entrar se marcan todas como leídas automáticamente.
  - `App.jsx`: ruta `/notificaciones` registrada — hereda transiciones `page-fadeIn/fadeOut`.
  - `Home.jsx`: botón "Ver todo" en dropdown cierra el panel y navega a `/notificaciones`; color cambiado a `#F5A623`.

### 2026-05-12 - Claude Code Sonnet 4.6 (sesión 41)
- **Username case-insensitive + email duplicado en registro:**
  - Supabase: índice único cambiado a `LOWER(username)`; trigger `handle_new_user` guarda `LOWER(username)`; constraint acepta `[A-Za-z0-9_]`.
  - `authValidation.js`: `validateUsername` acepta mayúsculas (`^[A-Za-z0-9_]+$`).
  - `Login.jsx`: input username no fuerza lowercase al escribir; chequeo de email duplicado en tabla `usuarios` antes del signUp.

### 2026-05-12 - Claude Code Sonnet 4.6 (sesión 39)
- **Viewer de guías con mapa de ruta:**
  - `lugaresService.js`: función `getLugaresByIds(ids)` con lat/lng, dirección, categorías y departamentos.
  - `Guias.jsx`: `useSearchParams` lee `?ver={id}` (abre viewer) y `?editar={id}` (pre-carga editor). Componentes `ViewerStop`, `GuiaViewer` y helper `buildRouteMapUrl` (iframe Google Maps `/dir/` multi-waypoint sin API key). Render guard al inicio del return.
  - `Perfil.jsx` — TabGuias: dos botones por guía — "Ver ruta" (`/guias?ver=id`) y "Editar" (`/guias?editar=id`).
  - `Perfil.css`: clase `.perfil-guia-btn--ver` (outlined amarillo).

### 2026-05-12 - Claude Code Sonnet 4.6 (sesión 38)
- **Fix post-registro en Login:** tras `signUp` exitoso el form vuelve a modo login con correo prellenado; eliminado mensaje falso de confirmación por correo.

### 2026-05-13 - Claude Code Sonnet 4.6 (sesión 34)
- **Tab "Mis Guías" en Perfil:** Nueva tab en el perfil privado que muestra las rutas guardadas del usuario.
  - `Perfil.jsx`: estado `guias[]`, cargado en `loadData` con `getGuiasByUser`. Tab `🗺️ Mis Guías` con clase `perfil-tab-guias` (acento amarillo activo). Componente `TabGuias` con lista animada, cards con borde `#F5C842`, botón "Editar" que navega a `/guias`, y empty state con CTA.
  - `Perfil.css`: estilos `.perfil-guia-*`, `@keyframes perfilFadeUp`, `overflow-x:auto` en tabs para móvil.

### 2026-05-12 - Claude Code Sonnet 4.6 (sesión 32)
- **Feature Guías interactivas:** Nueva página `/guias` accesible desde el menú y el footer.
  - Supabase: tabla `guias` (uuid PK, user_id, nombre, descripcion, `lugares_ids uuid[]`, created_at, is_public) con RLS por usuario.
  - `src/services/guiasService.js`: `getGuiasByUser`, `createGuia`, `updateGuia`, `deleteGuia`.
  - `src/pages/Guias.jsx`: hero crema+amarillo, timeline horizontal scrollable con cards conectadas por flechas SVG y StepperDots animados, buscador con search + filtro de categoría, grid responsive (2/3/4 cols) de mini-cards, sección "Mis rutas guardadas" con editar/eliminar. Si no hay sesión muestra CTA de login.
  - `App.jsx`: ruta `/guias` registrada.
  - `Home.jsx`: menú hamburguesa, `handleFooterNav` y footer navegan a `/guias`; eliminado string `guiasProx` obsoleto.

También actualiza el campo `last_updated` en la raíz del JSON con la fecha actual.

Esta instrucción aplica para **cualquier agente de AI** que trabaje en este proyecto (Claude Code, Cursor, Windsurf, Copilot, etc.).
