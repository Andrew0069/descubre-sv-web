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

### 2026-05-12 - Gemini (sesión 30)
- **FotoLightbox reescrito — fix de imagen cortada:** La foto de reseña se cortaba en escritorio y móvil porque en móvil `maxHeight:none` + `width:100%` hacía la imagen más alta que el viewport, y `onClick=handleClose` en el backdrop interceptaba todos los toques impidiendo scroll.
- **Móvil:** Layout fullscreen `flex-column`. Área de imagen usa `flex:1` + `overflow:hidden` con `objectFit:contain` — foto siempre visible completa. Panel de reviewer como strip oscuro abajo con `maxHeight:35vh` scrollable. Swipe horizontal preservado.
- **Desktop:** Contenedor split con `maxHeight:90vh`, imagen con `objectFit:contain`, panel blanco scrollable a la derecha.
- **Resultado:** La foto ahora siempre se muestra completa sin recorte ni necesidad de hacer zoom out, en ambas plataformas.

También actualiza el campo `last_updated` en la raíz del JSON con la fecha actual.

Esta instrucción aplica para **cualquier agente de AI** que trabaje en este proyecto (Claude Code, Cursor, Windsurf, Copilot, etc.).
