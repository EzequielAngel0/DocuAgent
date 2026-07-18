"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Menu, X } from "lucide-react";

export default function Navbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Inicializar tema leyendo el atributo seteado en HTML (evita flash).
  /* eslint-disable react-hooks/set-state-in-effect -- sincronización client-only
     con el DOM (data-theme): un initializer causaría hydration mismatch en SSR. */
  useEffect(() => {
    const activeTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark" || "light";
    setTheme(activeTheme);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Chat de IA", href: "/chat" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LOGO */}
        <Link href="/" className="navbar-logo">
          <img src="/logo.svg" alt="DocuAgent Logo" width="28" height="28" className="navbar-logo-img" />
          <span className="navbar-logo-text">
            Docu<span>Agent</span>
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="navbar-desktop-menu">
          <ul className="navbar-links">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`navbar-link ${isActive ? "active" : ""}`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            onClick={toggleTheme}
            className="navbar-theme-toggle btn-icon"
            aria-label="Cambiar tema"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        {/* MOBILE CONTROLS */}
        <div className="navbar-mobile-controls">
          <button
            onClick={toggleTheme}
            className="navbar-theme-toggle btn-icon"
            aria-label="Cambiar tema"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="navbar-hamburger btn-icon"
            aria-label="Menú principal"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <div className={`navbar-mobile-drawer ${isMobileMenuOpen ? "open" : ""}`}>
        <ul className="navbar-mobile-links">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`navbar-mobile-link ${isActive ? "active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
