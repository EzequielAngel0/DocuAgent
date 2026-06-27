import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Interceptar accesos a /admin y subrutas (excluyendo el login)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const token = request.cookies.get("auth_token")?.value;

    // Si no existe la cookie, redirigir al login
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configurar para interceptar /admin y cualquier subruta
export const config = {
  matcher: ["/admin/:path*"],
};
