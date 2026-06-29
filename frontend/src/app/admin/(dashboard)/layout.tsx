"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Files,
  FolderKanban,
  History,
  MessageSquare,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Bot
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const activeTheme = document.documentElement.getAttribute("data-theme") as "light" | "dark" || "light";
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleLogout = () => {
    // Limpia la cookie del lado cliente y notifica al backend (best-effort).
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    fetch(`${baseUrl}/auth/logout`, { method: "POST", credentials: "include" })
      .catch(() => {})
      .finally(() => router.push("/"));
  };

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={18} /> },
    { name: "Documentos", href: "/admin/documents", icon: <Files size={18} /> },
    { name: "Categorías", href: "/admin/categories", icon: <FolderKanban size={18} /> },
    { name: "Historial", href: "/admin/history", icon: <History size={18} /> },
  ];

  return (
    <div className="admin-layout flex">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header flex items-center justify-between">
          <Link href="/" className="navbar-logo">
            <img src="/logo.svg" alt="DocuAgent Logo" width="24" height="24" />
            <span className="navbar-logo-text">Docu<span>Agent</span></span>
          </Link>
          <button
            className="admin-sidebar-close btn-icon mobile-only"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <ul className="admin-sidebar-links">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`admin-sidebar-link ${isActive ? "active" : ""}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/chat" className="admin-sidebar-link-chat flex items-center">
            <MessageSquare size={18} style={{ marginRight: "10px" }} />
            <span>Volver al Chat</span>
          </Link>
          
          <button onClick={handleLogout} className="admin-sidebar-logout-btn flex items-center">
            <LogOut size={18} style={{ marginRight: "10px" }} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENT WRAPPER */}
      <div className="admin-main-wrapper flex flex-col">
        {/* HEADER */}
        <header className="admin-header flex items-center justify-between">
          <button
            className="admin-header-menu-toggle btn-icon mobile-only"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <div className="admin-header-title-group">
            <h2>Panel Administrativo</h2>
          </div>

          <div className="admin-header-controls flex items-center">
            <button
              onClick={toggleTheme}
              className="navbar-theme-toggle btn-icon"
              aria-label="Cambiar tema"
              style={{ marginRight: "var(--space-md)" }}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="admin-user-profile flex items-center">
              <div className="admin-avatar">A</div>
              <span className="admin-user-name">Admin</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="admin-page-content" style={{ flex: "1 0 auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
