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
  const [totpCode, setTotpCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const router = useRouter();
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    if (!turnstileChecked) {
      setError("Por favor, completa el desafío anti-bot.");
      return;
    }

    // Credenciales mockeadas: admin@empresa.com / admin
    if (email === "admin@empresa.com" && password === "admin") {
      setLoading(true);
      setError(null);
      setTimeout(() => {
        setStep(2);
        setLoading(false);
      }, 800);
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setIsLocked(true);
        setError("Cuenta bloqueada temporalmente por exceso de intentos (5 fallidos).");
      } else {
        setError(`Credenciales inválidas. Intentos fallidos: ${nextAttempts}/5.`);
      }
    }
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

    // Código TOTP de prueba: 123456
    if (finalCode === "123456") {
      setLoading(true);
      setError(null);

      setTimeout(() => {
        // Escribir la cookie de autenticación real en el cliente para el middleware
        document.cookie = "auth_token=mock_jwt_token_docuagent_staging; path=/; max-age=900; SameSite=Lax";
        
        // Redirigir al dashboard con recarga completa para asegurar envío de cookie
        window.location.href = "/admin";
      }, 1000);
    } else {
      setError("Código TOTP inválido. Intenta de nuevo.");
      setTotpCode(Array(6).fill(""));
      totpRefs.current[0]?.focus();
    }
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

              {/* CLOUDFLARE TURNSTILE MOCK */}
              <div className="turnstile-mock-container">
                <div className="turnstile-mock-box flex items-center justify-between">
                  <label className="turnstile-checkbox-label flex items-center">
                    <input
                      type="checkbox"
                      className="turnstile-checkbox"
                      checked={turnstileChecked}
                      onChange={(e) => setTurnstileChecked(e.target.checked)}
                      disabled={loading || isLocked}
                    />
                    <span className="turnstile-checkbox-text">No soy un robot (Cloudflare Turnstile)</span>
                  </label>
                  <div className="turnstile-brand">
                    <ShieldCheck size={18} className="icon-olive" />
                    <span>Verificado</span>
                  </div>
                </div>
              </div>

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
