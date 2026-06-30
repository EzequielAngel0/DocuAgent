import type { NextConfig } from "next";

// Orígenes de la API/WS (build-time) para autorizarlos en connect-src del CSP.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/chat/ws";
const apiOrigin = new URL(apiUrl).origin;
const wsOrigin = new URL(wsUrl).origin;

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' es necesario por la hidratación de Next y los estilos inline.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${apiOrigin} ${wsOrigin}`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
