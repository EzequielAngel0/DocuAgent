# ⚛️ Arquitectura del Frontend

## Visión General

El frontend está construido con **Next.js 16** (App Router) + **React 19** y
**TypeScript**, con tres áreas: **landing** (pública), **chat** (conversacional
pública por WebSocket) y **admin** (protegido con password + Turnstile + TOTP).
Todo es **100% responsive** (mobile-first).

> ⚠️ **Estado real vs. objetivo.** La estructura de abajo es el **diseño
> objetivo**. Hoy el código es más plano:
> - `src/app/`: `page.tsx` (landing), `chat/page.tsx`, `admin/login/page.tsx`,
>   `admin/(dashboard)/{page,categories,documents,documents/[id]/chunks,history,layout}.tsx`,
>   `middleware.ts` (guard `/admin/*`). **No** hay página `setup-2fa`.
> - `src/components/`: `chat/` (`ChatArea`, `ChatSidebar`, `MessageItem`,
>   `SourceCitations`), `landing/` (`Hero`, `Features`, `HowItWorks`,
>   `TechStack`), `layout/` (`Navbar`, `Footer`). **No** existen `ui/` ni
>   `admin/` como carpetas de componentes.
> - **No** hay capas `hooks/`, `lib/` ni `types/`: las llamadas a la API REST y
>   al WebSocket están **inline** en cada `page.tsx`, usando
>   `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` (que se **inlinean en build**).
> Extraer esa lógica a `hooks/ + lib/ + types/` es un refactor futuro.

## Estructura del Frontend (objetivo)
```
frontend/
├── src/
│   ├── app/                        # App Router (Next.js 15)
│   │   ├── layout.tsx              # Layout raíz (fuentes, metadata, navbar)
│   │   ├── page.tsx                # Landing page (SSR)
│   │   ├── globals.css             # Estilos globales + CSS variables
│   │   │
│   │   ├── chat/
│   │   │   ├── page.tsx            # Página principal del chat
│   │   │   └── layout.tsx          # Layout del chat
│   │   │
│   │   └── admin/
│   │       ├── login/
│   │       │   └── page.tsx        # Login (email + password + Turnstile + TOTP)
│   │       ├── setup-2fa/
│   │       │   └── page.tsx        # Setup 2FA (QR code primer acceso)
│   │       ├── page.tsx            # Dashboard (stats generales)
│   │       ├── documents/
│   │       │   ├── page.tsx        # Gestión de documentos (upload, lista, estado)
│   │       │   └── [id]/
│   │       │       └── chunks/
│   │       │           └── page.tsx  # Chunks de un documento específico
│   │       ├── categories/
│   │       │   └── page.tsx        # CRUD de categorías
│   │       ├── history/
│   │       │   └── page.tsx        # Historial de consultas del chat
│   │       └── layout.tsx          # Layout admin (sidebar + auth guard)
│   │
│   ├── components/
│   │   ├── ui/                     # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   ├── chat/                   # Componentes del chat
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── SourceCard.tsx
│   │   │   ├── FeedbackButtons.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── WelcomeMessage.tsx
│   │   │   └── AIBadge.tsx
│   │   │
│   │   ├── admin/                  # Componentes del admin
│   │   │   ├── LoginForm.tsx       # Form login + Turnstile + TOTP
│   │   │   ├── TurnstileWidget.tsx # Widget Cloudflare Turnstile
│   │   │   ├── TOTPInput.tsx       # Input 6 dígitos 2FA
│   │   │   ├── Setup2FA.tsx        # QR code + confirmación
│   │   │   ├── StatsCards.tsx      # Cards del dashboard
│   │   │   ├── DocumentUpload.tsx  # Drag & drop upload
│   │   │   ├── DocumentTable.tsx   # Tabla de documentos
│   │   │   ├── CategoryList.tsx    # Lista/CRUD categorías
│   │   │   ├── CategoryForm.tsx    # Modal crear/editar categoría
│   │   │   ├── ChunkViewer.tsx     # Lista de chunks de un doc
│   │   │   ├── ChatHistory.tsx     # Tabla de consultas históricas
│   │   │   └── FeedbackChart.tsx   # Gráfico de stats feedback
│   │   │
│   │   ├── landing/                # Componentes de la landing
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── TechStack.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── layout/
│   │       ├── Navbar.tsx          # Nav público (Landing · Chat · Admin)
│   │       ├── AdminSidebar.tsx    # Sidebar admin (Dashboard · Docs · Cats · Hist)
│   │       └── Container.tsx       # Contenedor responsive
│   │
│   ├── hooks/
│   │   ├── useChat.ts              # Lógica del chat
│   │   ├── useWebSocket.ts         # WebSocket streaming
│   │   ├── useAuth.ts              # Estado de autenticación + tokens
│   │   ├── useDocuments.ts         # CRUD documentos
│   │   └── useCategories.ts        # CRUD categorías
│   │
│   ├── lib/
│   │   ├── api.ts                  # Cliente API (con interceptor JWT)
│   │   ├── auth.ts                 # Login, refresh, logout, 2FA
│   │   ├── websocket.ts            # Cliente WebSocket
│   │   ├── constants.ts
│   │   └── utils.ts
│   │
│   ├── types/
│   │   ├── chat.ts                 # Message, Source, Session
│   │   ├── document.ts             # Document, Chunk, UploadStatus
│   │   ├── category.ts             # Category
│   │   ├── auth.ts                 # LoginRequest, TokenResponse, User
│   │   └── api.ts                  # ApiResponse, PaginatedResponse
│   │
│   └── styles/
│       ├── chat.css
│       ├── landing.css
│       └── admin.css
│
├── public/
│   ├── favicon.ico
│   └── images/
│
├── middleware.ts                    # Auth guard: redirect /admin/* → /admin/login
├── next.config.ts
├── tsconfig.json
├── package.json
├── Containerfile
└── .env.local
```

## Páginas

### Landing Page (`/`)
- **Renderizado**: SSR para SEO
- **Contenido**: Hero, características, cómo funciona, tech stack, CTA al chat
- **Acceso**: Público

### Chat (`/chat`)
- **Renderizado**: CSR con WebSocket
- **Acceso**: Público (cualquier colaborador)
- **Funcionalidades**:
  - Envío de mensajes con streaming de respuesta
  - Historial de conversación (sesión)
  - Visualización de fuentes citadas
  - Botones de feedback por respuesta
  - Indicador "Agente de IA"
  - Indicador de "escribiendo..."

### Admin Login (`/admin/login`)
- **Acceso**: Público (pero solo admins tienen credenciales)
- **Flujo**: Email + Password → Turnstile → TOTP 2FA → JWT
- **Anti-bot**: Cloudflare Turnstile obligatorio
- **2FA**: TOTP (Google Authenticator) obligatorio
- **Rate limit**: Máximo 5 intentos cada 15 minutos

### Admin Dashboard (`/admin`)
- **Acceso**: Protegido (JWT válido)
- **Contenido**: Stats generales (documentos, chunks, consultas, feedback %)

### Admin Documentos (`/admin/documents`)
- **Upload**: Drag & drop multi-archivo con selector de categoría
- **Tabla**: Nombre, categoría, estado (pendiente/procesando/indexado/error), fecha
- **Acciones**: Re-indexar, ver chunks, eliminar
- **Responsive**: Cards en móvil en vez de tabla

### Admin Categorías (`/admin/categories`)
- **CRUD**: Crear, editar, eliminar con nombre, slug, color, icono
- **Conteo**: Documentos por categoría

### Admin Historial (`/admin/history`)
- **Tabla**: Pregunta, respuesta (truncada), fuentes, confianza, fecha
- **Filtros**: Fecha, categoría, con/sin fallback
- **Expandible**: Click para ver respuesta completa

### Admin Chunks (`/admin/documents/:id/chunks`)
- **Lista**: Chunks de un documento con contenido, índice, metadatos

## Comunicación con el Backend

### REST API (con interceptor JWT para admin)

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  // Inyectar JWT si existe (rutas admin)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // Si el token expiró, refrescar y reintentar una vez
  if (response.status === 401 && accessToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retry = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      if (!retry.ok) throw new ApiError(retry.status, await retry.text());
      return retry.json();
    }
  }

  if (!response.ok) throw new ApiError(response.status, await response.text());
  return response.json();
}
```

### Autenticación (Login + Turnstile + TOTP)

```typescript
// lib/auth.ts
export async function login(email: string, password: string, turnstileToken: string) {
  // Paso 1: Validar credenciales + Turnstile
  const res = await apiClient<{ requires_2fa: boolean; temp_token: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password, turnstile_token: turnstileToken }) }
  );
  return res; // { requires_2fa: true, temp_token: '...' }
}

export async function verify2FA(tempToken: string, totpCode: string) {
  // Paso 2: Validar código TOTP → JWT final
  const res = await apiClient<{ access_token: string; expires_in: number }>(
    '/auth/verify-2fa',
    { method: 'POST', body: JSON.stringify({ temp_token: tempToken, totp_code: totpCode }) }
  );
  setAccessToken(res.access_token);
  return res;
}

export async function refreshAccessToken(): Promise<boolean> {
  // El refresh token viaja en HttpOnly cookie
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST', credentials: 'include',
  });
  if (!res.ok) { setAccessToken(null); return false; }
  const data = await res.json();
  setAccessToken(data.access_token);
  return true;
}
```

### WebSocket (chat en tiempo real)

```typescript
// hooks/useWebSocket.ts
export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    ws.current = new WebSocket(url);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Streaming: acumular tokens de la respuesta
      // Final: agregar fuentes citadas
    };
  }, [url]);

  const sendMessage = useCallback((content: string) => {
    ws.current?.send(JSON.stringify({ content, session_id }));
  }, []);

  return { messages, sendMessage, connect };
}
```

### Middleware de Protección (Next.js)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';

  if (isAdminRoute && !isLoginRoute) {
    // Verificar que existe el refresh token (HttpOnly cookie)
    const hasRefreshToken = request.cookies.has('refresh_token');
    if (!hasRefreshToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: '/admin/:path*' };
```

## Diseño y Estilos

### Stack de Estilos
- **CSS Vanilla** como base (sin TailwindCSS)
- **CSS Variables** para el sistema de diseño (colores, espaciado, tipografía)
- **CSS Modules** o estilos por componente para encapsulación
- **Google Fonts**: Inter (texto) + JetBrains Mono (código)

### Sistema de Diseño (CSS Variables)

```css
/* globals.css */
/* Sistema de Diseño: Minimalista Editorial Flat (Temas Claro y Oscuro) */
:root {
  /* ==========================================
     TEMA CLARO (Light Mode - por defecto)
     ========================================== */
  --bg-primary: #FAF8F5;       /* Crema suave/arena */
  --bg-secondary: #F3EFEA;     /* Arena más oscuro para sidebar */
  --bg-surface: #FFFFFF;       /* Blanco sólido para tarjetas/mensajes */
  
  --text-primary: #2C2621;     /* Carbón cálido oscuro */
  --text-secondary: #5C524A;   /* Sepia/gris para subtítulos */
  --text-muted: #8C7F74;       /* Tono apagado para metadatos */

  /* Colores de acento */
  --color-primary: #C85A32;    /* Terracota */
  --color-primary-hover: #A04422;
  --color-secondary: #8E8D30;  /* Verde oliva silenciado */
  --color-accent: #D9A036;     /* Ámbar suave */
  --color-bronze: #8C6A4B;     /* Bronce */

  /* Bordes limpios (Sin glassmorphism) */
  --border-subtle: #E8E2D9;    /* Borde fino */
  --border-strong: #D5CBBF;

  /* Espaciado */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Sombras planas o muy difusas */
  --shadow-sm: 0 1px 2px rgba(44, 38, 33, 0.05);
  --shadow-md: 0 4px 8px rgba(44, 38, 33, 0.08);
  --shadow-lg: 0 8px 16px rgba(44, 38, 33, 0.12);

  /* Transiciones */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
}

[data-theme="dark"] {
  /* ==========================================
     TEMA OSCURO (Dark Mode)
     ========================================== */
  --bg-primary: #12100E;       /* Carbón cálido oscuro */
  --bg-secondary: #1C1815;     /* Superficie de sidebar oscura */
  --bg-surface: #24201C;       /* Tarjetas en carbón más claro */
  
  --text-primary: #F4EFEB;     /* Arena claro/crema */
  --text-secondary: #C3B8AE;   /* Gris/sepia suave */
  --text-muted: #8E8277;       /* Metadatos oscuros */

  /* Colores de acento */
  --color-primary: #E07348;    /* Terracota brillante */
  --color-primary-hover: #C85A32;
  --color-secondary: #A3A23C;  /* Verde oliva */
  --color-accent: #E5B453;     /* Ámbar */

  /* Bordes oscuros */
  --border-subtle: #38312B;
  --border-strong: #4F453C;

  /* Sombras oscuras */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.4);
}
```

## Variables de Entorno del Frontend

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/chat/ws
NEXT_PUBLIC_APP_NAME=DocuAgent
NEXT_PUBLIC_APP_DESCRIPTION=Agente RAG de Documentación Empresarial

# Cloudflare Turnstile (anti-bot en login)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAXXXXXXXXXXXXXXX
```
