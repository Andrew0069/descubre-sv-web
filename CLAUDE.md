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

## Resumen de sesion reciente

### 2026-05-06 - Claude Code
- Lightbox de fotos en `DetalleLugar.jsx` rediseñado con layout estilo Yelp: backdrop centrado + contenedor fila ajustado al tamaño de la imagen.
- Panel blanco de info ahora ocupa exactamente el mismo alto que la imagen (no toda la pantalla).
- Lightbox responsive: en móvil (<768px) usa layout vertical (imagen arriba ~58vh, info abajo scrollable); en desktop mantiene layout horizontal.
- Panel de notificaciones en `Home.jsx` corregido en móvil: usa `position:fixed` con `left/right:12px` para no cortarse fuera del viewport.
- `npm run build` paso correctamente en todos los cambios.

También actualiza el campo `last_updated` en la raíz del JSON con la fecha actual.

Esta instrucción aplica para **cualquier agente de AI** que trabaje en este proyecto (Claude Code, Cursor, Windsurf, Copilot, etc.).
