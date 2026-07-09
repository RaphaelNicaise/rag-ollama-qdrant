# RAG Local — Client

Frontend para el sistema RAG Local. Permite chatear con tus documentos, gestionar modelos de Ollama y ver los archivos indexados en Qdrant.

## Stack

| Capa | Tecnología |
|------|-----------|
| Build | Vite 6 |
| Framework | React 19 + TypeScript |
| Routing | TanStack Router (file-based) |
| Estado async | TanStack Query v5 |
| Estilos | Tailwind CSS v4 |
| Tipografía | Geist Sans + Geist Mono |
| Iconos | Phosphor Icons |

## Arquitectura

```
src/
  main.tsx              Punto de entrada (Router + QueryClient providers)
  app.css               Tokens de diseño + Tailwind base
  lib/
    api.ts              Wrappers tipados para todos los endpoints del backend
  routes/
    __root.tsx          Layout raíz con sidebar de navegación
    index.tsx           Página de chat (preguntas al RAG)
    models.tsx          Gestión de modelos Ollama (listar, descargar, eliminar)
    documents.tsx       Lista de documentos indexados en Qdrant
  components/
    chat-message.tsx    Burbuja de mensaje (user/assistant)
    progress-bar.tsx    Barra de progreso para descargas de modelos
```

## Desarrollo

### Con Docker (recomendado)

Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

El cliente corre en `http://localhost:5173` con hot-reload habilitado.

### Sin Docker

```bash
cd client
npm install
npm run dev
```

Requiere que el backend esté corriendo en `http://localhost:8000`.

## Páginas

- **Chat** (`/`) — Interfaz de chat con upload de archivos integrado. Muestra tiempo de respuesta y tokens consumidos.
- **Modelos** (`/models`) — Lista modelos instalados en Ollama, permite descargar nuevos con barra de progreso en streaming y eliminar existentes.
- **Documentos** (`/documents`) — Muestra todos los archivos indexados en Qdrant. Permite subir nuevos documentos.
- **Qdrant Dashboard** — Link externo en el sidebar hacia `http://localhost:6333/dashboard`.
