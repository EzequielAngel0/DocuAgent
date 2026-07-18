// Tipado global del widget de Cloudflare Turnstile (script externo cargado en
// runtime). Evita los casts `(window as any)` en las páginas de chat y login.
interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "flexible" | "compact";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
}

interface TurnstileAPI {
  render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string;
}

interface Window {
  turnstile?: TurnstileAPI;
  /** Callback global que invoca el script de Turnstile del login admin. */
  onloadTurnstileCallback?: () => void;
  /** Callback global que invoca el script de Turnstile del chat público. */
  onloadChatTurnstile?: () => void;
}
