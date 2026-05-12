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

### 2026-05-11 - Claude Code (sesión 29)
- **Hero al volver a Home:** `_lugaresCache` agregado a nivel de módulo para inicializar `lugares` con datos previos al remontar — elimina el parpadeo de hero azul vacío al regresar desde DetalleLugar.
- **Thumbnails de reseñas:** Cambiados a contenedores cuadrados fijos 110×110px con `overflow:hidden` y `objectFit:cover` para evitar recortes en fotos de cualquier proporción.
- **FotoLightbox rediseñado:** Ahora usa el mismo layout split que el lightbox de fotos del lugar (imagen oscura izquierda + panel blanco derecha). Muestra avatar, nombre del reviewer, rating en corazones y texto de la reseña. En móvil el panel aparece debajo. Cierre con fade-out de 260ms y botón `← Volver` estilo pill.

También actualiza el campo `last_updated` en la raíz del JSON con la fecha actual.

Esta instrucción aplica para **cualquier agente de AI** que trabaje en este proyecto (Claude Code, Cursor, Windsurf, Copilot, etc.).
