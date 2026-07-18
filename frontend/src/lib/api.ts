// Cliente HTTP del panel admin.
//
// La sesión viaja en la cookie `auth_token` que fija el backend (con dominio
// compartido entre subdominios vía COOKIE_DOMAIN). Por eso TODAS las llamadas
// usan `credentials: "include"` y NO se lee el token desde JS — eso permite
// que la cookie sea httponly (no robable por XSS).
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, { credentials: "include", ...options });
}
