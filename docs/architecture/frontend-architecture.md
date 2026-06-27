# ⚛️ Arquitectura del Frontend

## Visión General

El frontend está construido con **Next.js 15** (App Router) y **TypeScript**, con tres áreas: **landing** (presentación pública), **chat** (interfaz conversacional pública) y **admin** (panel de administración protegido con autenticación, Turnstile y TOTP 2FA). Todo el frontend es **100% responsive** (mobile-first).

## Estructura del Frontend
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
:root {
  /* Colores principales */
  --color-primary: hsl(230, 80%, 60%);
  --color-primary-hover: hsl(230, 80%, 55%);
  --color-secondary: hsl(280, 70%, 55%);
  --color-accent: hsl(170, 70%, 50%);

  /* Fondo y superficie */
  --bg-primary: hsl(220, 20%, 8%);
  --bg-secondary: hsl(220, 18%, 12%);
  --bg-surface: hsl(220, 16%, 16%);
  --bg-elevated: hsl(220, 14%, 20%);

  /* Texto */
  --text-primary: hsl(220, 20%, 95%);
  --text-secondary: hsl(220, 15%, 70%);
  --text-muted: hsl(220, 10%, 50%);

  /* Bordes y glassmorphism */
  --border-subtle: hsla(220, 20%, 50%, 0.15);
  --glass-bg: hsla(220, 20%, 15%, 0.6);
  --glass-border: hsla(220, 20%, 50%, 0.1);
  --glass-blur: 12px;

  /* Espaciado */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm: 0 2px 4px hsla(0, 0%, 0%, 0.2);
  --shadow-md: 0 4px 12px hsla(0, 0%, 0%, 0.3);
  --shadow-lg: 0 8px 24px hsla(0, 0%, 0%, 0.4);

  /* Transiciones */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
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
