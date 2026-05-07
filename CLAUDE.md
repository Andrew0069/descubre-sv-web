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

### 2026-05-06 - Codex
- Se ajusto el carrusel hero de `src/pages/Home.jsx` para reducir el delay visual inicial sin cambiar dimensiones ni layout.
- Las imagenes del hero ahora se renderizan como `<img>`; la primera usa `loading="eager"` y `fetchPriority="high"`.
- Se mantuvo `hero-bg.png` como fondo inmediato debajo del carrusel mientras cargan las imagenes remotas.
- La transformacion de imagenes del hero subio a `2400x1200` para mejorar nitidez en pantallas anchas.
- Se agrego reset de `heroIdx` cuando cambia la lista de imagenes.
- `npm run build` paso correctamente; queda un warning preexistente de `border` duplicado en `Home.jsx`.

También actualiza el campo `last_updated` en la raíz del JSON con la fecha actual.

Esta instrucción aplica para **cualquier agente de AI** que trabaje en este proyecto (Claude Code, Cursor, Windsurf, Copilot, etc.).
