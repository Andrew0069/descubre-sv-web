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

### 2026-05-10 - Claude Code (sesión 24)
- **Carrusel hero desbloqueado:** `heroNextIdx` fue removido del array de dependencias del efecto `auto-rotate`. El bug era que al llamar `setHeroNextIdx` dentro del timer, React ejecutaba el cleanup del efecto (fijando `cancelled=true`) antes de que el `requestAnimationFrame` pudiera llamar `setHeroIsFading(true)`. El carrusel quedaba en `heroNextIdx=1 / heroIsFading=false` para siempre.
- **Blink inicial eliminado:** Se agregó `heroImgRef` (useRef) apuntando al `<img>` del hero actual. En el efecto del splash, después de que `preloadHeroImage` resuelve, se llama `heroImgRef.current?.decode()` antes de iniciar el fade-out, garantizando que el DOM haya decodificado y pintado la imagen antes de revelarla.
- Se eliminó `decoding="async"` del img actual del hero para no diferir la decodificación al momento del pintado.

También actualiza el campo `last_updated` en la raíz del JSON con la fecha actual.

Esta instrucción aplica para **cualquier agente de AI** que trabaje en este proyecto (Claude Code, Cursor, Windsurf, Copilot, etc.).
