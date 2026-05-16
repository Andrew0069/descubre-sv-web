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

### 2026-05-16 - Claude Code Opus 4.7 1M (sesión 68)
- **Iteración del restyle DetalleLugar — paridad mobile + Ruta distinta + fallback Cerquita:**
  - Archivos: `src/index.css`, `src/components/LugarTravelerPanel.jsx`, `src/pages/DetalleLugar.jsx`.
  - **Traveler panel `.traveler-panel`:** borde `1.5px solid #1F1611` + hard-shadow `0 4px 0 #1F1611`. Gradiente amarillo más saturado (`#FFE38A → #FFCD45 → #FFB820`).
  - **`.traveler-panel__eyebrow`:** convertido a pill negro `#1F1611` con texto amarillo `#FFCD45` y prefix `✦` coral via `::before`. Title con Bricolage Grotesque 800.
  - **`.traveler-tab`:** borde negro 1.5px sobre fondo blanco; estado `.is-active` ahora negro `#1F1611` con texto blanco (antes gradiente amarillo→magenta).
  - **`.traveler-card` / `.traveler-budget-card`:** borde negro 1.5px + hard-shadow `0 3px 0 #1F1611` (en lugar de soft warm shadow). Títulos h4 con Bricolage Grotesque.
  - **`.traveler-chip` variantes:** todas con borde negro 1.5px; `--deep` cambiado a coral `#FF6B3D`. `.traveler-route-badge` en negro con texto amarillo `#FFCD45`.
  - **LugarTravelerPanel.jsx:** chips del hero ahora muestran `📍 dep`, `🏷 categoría/subtipo` y `✦ Entrada {precio}` (coral deep) cuando hay `precio_entrada`.
  - **Mobile hero gallery (DetalleLugar.jsx):** carrusel swipeable ahora con borde 1.5px negro + hard-shadow + pill coral `✦ FOTO DESTACADA` overlay cuando `carouselIdx === 0` (paridad con desktop).
  - **Cards "Cerquita de aquí" (fallback):** bloque de imagen ahora con borde inferior negro 1.5px; reemplazado `background:url()` por `<img loading="lazy" onError=hide>` para detectar fallos reales de carga. Cuando no hay imagen se renderiza emoji 🏝️ sobre el gradiente de categoría. Pill de categoría con borde negro + hard-shadow `0 2px 0 #1F1611`.
  - Build: `npm run build` OK, sin errores nuevos.

### 2026-05-16 - Claude Code Opus 4.7 1M (sesión 67)
- **Restyle editorial del DetalleLugar (cero cambios de lógica) — hero + cards con bordes negros delgados + hard-shadow:**
  - Archivo único: `src/pages/DetalleLugar.jsx`. Sin tocar handlers, queries Supabase, RLS, hooks ni firmas — solo JSX/estilos inline.
  - **Hero header:** botón `← Volver` → pill blanco con borde negro 1.5px. Añadidos: botón circular **Compartir** (navigator.share con fallback a clipboard + toast "Enlace copiado"), pill **Guardar** negro con icono bookmark que toggle `esFavorito` (texto cambia a "Guardado"), y pill coral **"✦ Joya local"** visible solo cuando `lugar.es_joya_local`.
  - **Gallery desktop:** los 3 slots ahora con `border: 1.5px solid #1F1611`, `borderRadius: 20px`, gap 10px. Pill coral **"✦ FOTO DESTACADA"** absolute top-left del slot principal. Botón "Ver las N fotos" → pill negro con shadow oscuro (count dinámico).
  - **Pills bajo gallery:** categoría como pill outline negro sobre blanco + departamento como pill **amarillo `#FFE9A6`** con borde negro y pin 📍. Sticker Joya local removido (ahora en header del hero).
  - **Título H1:** parser regex que separa el nombre del paréntesis final. `(BINAES)` y similares se renderizan en **Caveat italic coral `#FF6B3D`** al lado del nombre principal.
  - **Cards principales:** estilo unificado cream `#FFFBF1` + borde `1.5px solid #1F1611` + hard-shadow `0 4px 0 #1F1611` + radius 20px. Aplicado a "Sobre este lugar", "Ubicación", "Reseñas".
  - **Quick Facts:** ahora con borde negro 1.5px sobre fondo blanco (en lugar de cream `#EFE3CC`).
  - **Ubicación:** header con título Bricolage + pill outline "↗ Abrir en Maps" cuando hay coords. Botón **"Cómo llegar desde donde estás"** convertido a full-width black con hard-shadow coral `0 4px 0 #FF6B3D`.
  - **Horarios (es24Horas):** card verde `#EAF7E8` con borde negro y pill verde "● Abierto ahora". Card interno blanco con "24 horas, todos los días" + subtítulo. Grid de 7 días LUN–DOM con dot verde.
  - **Reseñas:** botón "Escribir reseña" migrado de azul `#0EA5E9` a pill **coral `#FF6B3D`** con borde negro y hard-shadow. Header con título Bricolage + meta "N reseñas · X% positivas" (calc en cliente).
  - **Nueva CTA "¿Ya lo visitaste?"** (right col, después de Reseñas): card dashed amarillo `#FFF3D4`/`#F5A623` con eyebrow Caveat coral + botón negro "Contar" que abre el modal de reseña (con fallback a login si no hay sesión).
  - **Cerquita de aquí:** agregado contador "N lugares a menos de 10 min caminando" + pill "Ver todos →" a la derecha. Cards con borde negro + hard-shadow `0 4px 0 #1F1611` (en lugar de soft warm shadow).
  - Build: `npm run build` OK, sin errores nuevos.

### 2026-05-16 - Claude Code Opus 4.7 (sesión 66)
- **Rediseño Spotter del DetalleLugar (sutil) + 5 campos nuevos por lugar en Admin:**
  - Archivos: `index.html`, `src/pages/DetalleLugar.jsx`, `src/pages/AdminPage.jsx`, `src/components/EditLugarForm.jsx`, `src/components/NewLugarForm.jsx`, `src/services/lugaresService.js`. Supabase: migración `add_spotter_fields_to_lugares`.
  - **Migración BD:** `lugares` recibe `tiene_wifi bool`, `apto_familias bool`, `tiempo_recomendado text`, `dato_viajero text`, `es_joya_local bool default false`. `precio_entrada` ya existía.
  - **Admin (Edit + New LugarForm):** nuevo bloque "Spotter · datos extra" con textarea `dato_viajero`, input `tiempo_recomendado` y 3 toggles `tiene_wifi` / `apto_familias` / `es_joya_local`. `handleFormChange` y `handleNewLugarChange` ahora detectan `type=checkbox` y usan `checked`. Payloads de create/update incluyen los 5 campos (textos vacíos → null).
  - **lugaresService.js:** nuevo `getLugaresCercanos({lat,lng,excludeId,limit})` — query a Supabase con `not null` en lat/lng, calcula distancia Haversine en cliente y devuelve top N ordenados por `_km` ascendente. `getLugaresAdmin`/`createLugar` extienden el SELECT.
  - **DetalleLugar.jsx — restyle sutil:** H1 con `Bricolage Grotesque 800` (`letter-spacing: -0.8px`, color `#1F1611`), H2 "Sobre este lugar" idem; descripción con `Plus Jakarta Sans` color `#3B2E22`. Cero cambios estructurales de cards (sin bordes negros, sin sombras duras).
  - **Sticker "✨ Joya local"** coral `#FF6B3D` al lado del `CategoryPill` cuando `lugar.es_joya_local`.
  - **Bloque "Dato para viajeros"** (fondo `#FFF3D4`, borde dashed `#F5A623`, eyebrow Caveat coral `#E0512A`) dentro del card About cuando `lugar.dato_viajero`.
  - **Quick Facts grid** `auto-fit minmax(120px,1fr)` con cards crema `#FFF8EC` y borde `#EFE3CC`: Entrada / Wi-Fi / Familias / Tiempo. Solo renderiza facts con valor presente.
  - **Sección "Cerquita de aquí · a pie"** después del body grid: hasta 4 lugares cercanos por distancia geográfica, badge de categoría con color de la categoría, label "Xm/Y.Z km · Departamento", hover `translateY(-3px)` + shadow lift.
  - **Fonts:** `index.html` carga ahora también `Bricolage Grotesque`, `Plus Jakarta Sans` y `Caveat` (las existentes DM Sans/Playfair/Space Mono quedan intactas).
  - Build: `npm run build` OK, sin errores nuevos.

### 2026-05-16 - Gemini 3.1 Pro / Antigravity (sesión 65)
- **Rediseño editorial tipo revista de la sección de Lugares en Home:**
  - Archivos: `index.html`, `src/index.css`, `src/components/LugarCard.jsx`, `src/pages/Home.jsx`. Cero cambios en lógica de fetch, favoritos, filtros, splash, servicios Supabase ni admin.
  - **Tipografía editorial:** Google Fonts cargadas en `index.html` (Playfair Display, DM Sans, Space Mono). CSS custom properties `--font-heading`, `--font-body` (Avenir Next → DM Sans fallback), `--font-mono` en `:root`.
  - **Layout masonry asimétrico:** `.editorial-masonry` — CSS Grid 12 columnas. Featured (primer item) = 8 cols en desktop, Secondary = 4 cols cada uno. Mobile (≤639px) colapsa a 1 columna. ~315 líneas de CSS editorial añadidas al final de `index.css` sin tocar estilos admin.
  - **LugarCard.jsx reescrito:** dos variantes — `editorial-card--featured` (imagen cinematic full-bleed con gradient overlay, título Playfair Display sobre imagen, ubicación Space Mono, rating amarillo) y `editorial-card--secondary` (imagen arriba + caption debajo, hover translateY + shadow, título serif con line-clamp). Preserva favoritos toggle, image error handling, category badges, skeleton loader.
  - **Home.jsx:** grid cambiado de `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` a `editorial-masonry`. Section heading usa `.editorial-section-label` (mono, blue, uppercase) y `.editorial-section-title` (serif, clamp).
  - **Fixes:** CSS corrupto restaurado desde git + re-aplicado limpiamente. Propiedad `display` duplicada en JSX eliminada. Cache Vite limpiado.
  - Build: `npm run dev` sin errores en consola. Verificado en desktop (1280px) y mobile (390px).

### 2026-05-16 - Claude Code Opus 4.7 (sesión 64)
- **Fix recarga del DetalleLugar al cambiar pestaña + cache del Home extendido a móvil:**
  - Archivos: `src/pages/Home.jsx`, `src/pages/DetalleLugar.jsx`. Cero cambios de lógica de fetch, splash visual, reseñas, favoritos o servicios.
  - **Root cause DetalleLugar:** Supabase dispara `TOKEN_REFRESHED` cada vez que la pestaña vuelve a ser visible. El `onAuthStateChange` hacía `setSession(nextSession)` con la nueva referencia → el `useCallback load` (deps `[id, session]`) se recreaba → el `useEffect([load])` re-ejecutaba `load()` → `setLoading(true)` + refetch de lugar/reseñas/likes/imágenes/favoritos. Visible como spinner + recarga al minimizar tab o abrir nueva.
  - **Fix DetalleLugar:** `setSession((prev) => prev?.user?.id === nextSession?.user?.id ? prev : nextSession)` — dedupe por `user.id`. TOKEN_REFRESHED ya no muta el state, sólo logout/login real lo hace.
  - **Home cache extendido:** quitados los dos `if (window.innerWidth < 768) return` en `writeHomeCache` e `initHomeCache` (antes `writeDesktopCache`/`initDesktopCache`) — ahora el `localStorage` cache funciona también en móvil. TTL subido de 5 min a **24 h** (`HOME_CACHE_TTL = 24*60*60*1000`). `loadLugares` ya no condiciona `silent` ni el write al viewport.
  - **Splash respetado:** revertida la línea `_splashShownOnce = true` dentro de `initHomeCache`. El splash sigue mostrándose siempre (el usuario va a rediseñarlo); el cache hidrata datos en background → cuando termina el splash, la grilla ya está lista → transición suave sin spinner intermedio.
  - Build: `npm run build` OK, sin errores nuevos.

### 2026-05-14 - Claude Code Sonnet 4.6 (sesión 61)
- **Fan de imágenes animado en Guías + programación por día/hora + detección de horarios:**
  - Archivos: `src/pages/Guias.jsx`, `src/services/guiasService.js`, `src/components/Toast.jsx`. Supabase: columna `paradas_config jsonb DEFAULT '{}'` en tabla `guias`.
  - **Fan animation:** `getPreviewImgs(lugar)` extrae hasta 3 URLs de `imagenes_lugar` (orden ascendente). `LugarChip` envuelto en `.lugar-chip-wrap` con overlay `.lugar-chip-fan` — en hover las 3 cartas se despliegan con rotaciones -18°/0°/+18° y `cubic-bezier(0.34,1.56,0.64,1)`; con 1 imagen sube sin rotar (`.is-single`).
  - **Scheduling por parada:** `rutaActual` migrado de `Lugar[]` a `ParadaItem[] ({ lugar, dia, hora })`. `TimelineCard` tiene nueva firma `({ lugar, dia, hora, onRemove, onUpdateParada, onToast })` con `<select>` de día (Lun–Dom) y `<input type="time">` que aparece al elegir día. Pill verde **"✓ Abierto"** / naranja **"⚠ Cerrado"** calculado por `useMemo`.
  - **Detección de horarios:** `checkHorario(lugar, dia, hora)` evalúa `es24Horas`, `cerrado_dia` (encuentra próximo día abierto), `antes_apertura` y `despues_cierre`. `format12h()` standalone para mensajes legibles. Toast naranja disparado automáticamente al cambiar día u hora.
  - **Persistencia:** `handleGuardar` construye `paradas_config: { [lugar_id]: {dia, hora} }` e incluye en el payload. `handleCargar` rehidrata `ParadaItem[]` desde `guia.paradas_config` al editar guía existente. Guías antiguas reciben `{}` como default — backward compatible.
  - **Toast.jsx:** reordenada detección — `"cerrado"` → `warning` (naranja) antes de check `success`; eliminado `"cerrad"` del branch de success para evitar colisiones.
  - Build: 119 módulos sin errores nuevos.

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
