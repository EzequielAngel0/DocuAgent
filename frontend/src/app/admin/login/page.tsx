"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, KeyRound, Bot, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [step, setStep] = useState<1 | 2>(1); // Paso 1: Email/Pass/Turnstile. Paso 2: TOTP 2FA.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileChecked, setTurnstileChecked] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const router = useRouter();
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Cargar script de Turnstile si la site key está presente
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (key) {
      setSiteKey(key);
      (window as any).onloadTurnstileCallback = () => {
        if ((window as any).turnstile) {
          (window as any).turnstile.render("#turnstile-widget", {
            sitekey: key,
            theme: "dark",
            callback: (token: string) => {
              setTurnstileToken(token);
              setTurnstileChecked(true);
            },
            "expired-callback": () => {
              setTurnstileToken("");
              setTurnstileChecked(false);
            }
          });
        }
      };

      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        delete (window as any).onloadTurnstileCallback;
      };
    }
  }, []);

  // Limpiar error al escribir
  useEffect(() => {
    setError(null);
  }, [email, password, turnstileChecked]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (!email || !password) {
      setError("Por favor, rellena todos los campos.");
      return;
    }

    if (siteKey && !turnstileToken) {
      setError("Por favor, completa el desafío anti-bot (Turnstile).");
      return;
    }

    if (!siteKey && !turnstileChecked) {
      setError("Por favor, completa el desafío de seguridad mock.");
      return;
    }

    setLoading(true);
    setError(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: password,
        turnstile_token: turnstileToken || "mock_turnstile"
      })
    })
    .then(async (res) => {
      setLoading(false);
      if (res.ok) {
        setStep(2);
      } else {
        const errData = await res.json();
        setError(errData.detail || "Credenciales incorrectas.");
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setIsLocked(true);
          setError("Cuenta bloqueada temporalmente por exceso de intentos (5 fallidos).");
        }
      }
    })
    .catch((err) => {
      setLoading(false);
      setError("No se pudo conectar con el servidor de autenticación.");
      console.error(err);
    });
  };

  const handleTotpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return; // solo números

    const newCode = [...totpCode];
    newCode[index] = value.substring(value.length - 1); // solo un carácter
    setTotpCode(newCode);
    setError(null);

    // Auto-focus al siguiente input
    if (value && index < 5 && totpRefs.current[index + 1]) {
      totpRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Volver al anterior input al borrar con backspace
    if (e.key === "Backspace" && !totpCode[index] && index > 0) {
      const newCode = [...totpCode];
      newCode[index - 1] = "";
      setTotpCode(newCode);
      totpRefs.current[index - 1]?.focus();
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = totpCode.join("");

    if (finalCode.length < 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    fetch(`${baseUrl}/auth/verify-2fa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        code: finalCode
      })
    })
    .then(async (res) => {
      setLoading(false);
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          document.cookie = `auth_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
        }
        window.location.href = "/admin";
      } else {
        const errData = await res.json();
        setError(errData.detail || "Código 2FA incorrecto.");
        setTotpCode(Array(6).fill(""));
        totpRefs.current[0]?.focus();
      }
    })
    .catch((err) => {
      setLoading(false);
      setError("Error de conexión al verificar el código 2FA.");
      console.error(err);
    });
  };

  return (
    <div className="login-page-wrapper flex items-center justify-between">
      <div className="login-card-container fade-in">
        
        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-lg)" }}>
          <Link href="/" className="navbar-logo" style={{ justifyContent: "center" }}>
            <img src="/logo.svg" alt="DocuAgent Logo" width="36" height="36" />
            <span style={{ fontSize: "1.6rem" }} className="navbar-logo-text">Docu<span>Agent</span></span>
          </Link>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Consola de Administración Segura
          </p>
        </div>

        <div className="card login-card">
          <div className="login-card-header">
            <Lock size={20} className="icon-terracotta" />
            <h3>{step === 1 ? "Iniciar Sesión" : "Verificación 2FA"}</h3>
          </div>

          {error && (
            <div className="login-error-alert flex items-center">
              <ShieldAlert size={16} style={{ marginRight: "8px", flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            /* PASO 1 */
            <form onSubmit={handleStep1Submit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">Correo Electrónico</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-field-icon" />
                  <input
                    id="email-input"
                    type="email"
                    className="form-input"
                    placeholder="admin@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || isLocked}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password-input">Contraseña</label>
                <div className="input-with-icon">
                  <KeyRound size={16} className="input-field-icon" />
                  <input
                    id="password-input"
                    type="password"
                    className="form-input"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || isLocked}
                    required
                  />
                </div>
              </div>

              {/* CLOUDFLARE TURNSTILE WIDGET O FALLBACK MOCK */}
              {siteKey ? (
                <div style={{ display: "flex", justifyContent: "center", margin: "var(--space-md) 0" }}>
                  <div id="turnstile-widget"></div>
                </div>
              ) : (
                <div className="turnstile-mock-container">
                  <div className="turnstile-mock-box flex items-center justify-between">
                    <label className="turnstile-checkbox-label flex items-center">
                      <input
                        type="checkbox"
                        className="turnstile-checkbox"
                        checked={turnstileChecked}
                        onChange={(e) => {
                          setTurnstileChecked(e.target.checked);
                          if (e.target.checked) setTurnstileToken("mock_turnstile");
                          else setTurnstileToken("");
                        }}
                        disabled={loading || isLocked}
                      />
                      <span className="turnstile-checkbox-text">No soy un robot (Cloudflare Turnstile Mock)</span>
                    </label>
                    <div className="turnstile-brand">
                      <ShieldCheck size={18} className="icon-olive" />
                      <span>Verificado</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary login-submit-btn"
                disabled={loading || isLocked}
              >
                {loading ? "Verificando..." : "Siguiente paso"}
              </button>

              <div className="login-help-note">
                <p><strong>Ayuda de prueba:</strong> Correo: <code>admin@empresa.com</code> | Clave: <code>admin</code></p>
              </div>
            </form>
          ) : (
            /* PASO 2 */
            <form onSubmit={handleStep2Submit} className="login-form">
              <p className="login-2fa-description">
                Introduce el código de verificación de 6 dígitos de tu aplicación Google Authenticator.
              </p>

              <div className="totp-inputs-row">
                {totpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    className="totp-input-box"
                    ref={(el) => {
                      totpRefs.current[idx] = el;
                    }}
                    value={digit}
                    onChange={(e) => handleTotpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleTotpKeyDown(idx, e)}
                    disabled={loading}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary login-submit-btn"
                disabled={loading}
              >
                {loading ? "Accediendo..." : "Confirmar Acceso"}
              </button>

              <button
                type="button"
                className="btn btn-secondary login-back-btn"
                onClick={() => {
                  setStep(1);
                  setTotpCode(Array(6).fill(""));
                  setError(null);
                }}
                disabled={loading}
              >
                Volver
              </button>

              <div className="login-help-note">
                <p><strong>Ayuda de prueba 2FA:</strong> Código TOTP: <code>123456</code></p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
