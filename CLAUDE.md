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
