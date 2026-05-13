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
