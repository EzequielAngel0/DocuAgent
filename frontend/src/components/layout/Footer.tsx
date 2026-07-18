import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/logo.svg" alt="DocuAgent Logo" width="20" height="20" className="footer-logo-img" />
            <span className="footer-logo-text">Docu<span>Agent</span></span>
          </div>
          <p className="footer-description">
            Agente conversacional inteligente que centraliza y responde consultas sobre la documentación de tu empresa mediante RAG.
          </p>
        </div>

        <div className="footer-links-container">
          <div className="footer-links-group">
            <h4 className="footer-links-title">Aplicación</h4>
            <ul>
              <li><Link href="/">Inicio</Link></li>
              <li><Link href="/chat">Chat de Consulta</Link></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-links-title">Proyecto</h4>
            <ul>
              <li><a href="https://github.com/EzequielAngel0/AluraAgente" target="_blank" rel="noopener noreferrer">Repositorio</a></li>
              <li><Link href="/docs">Documentación</Link></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-links-title">Legal</h4>
            <ul>
              <li><a href="https://angelezequiel.dev/docuagent/privacidad" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a></li>
              <li><a href="https://angelezequiel.dev/docuagent/terminos" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copy">
            &copy; {currentYear} DocuAgent. Desarrollado como proyecto para el programa de formación en IA de Alura LATAM.
          </p>
          <a
            href="https://github.com/EzequielAngel0/AluraAgente"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-github-link"
            aria-label="GitHub del proyecto"
          >
            <svg
              height="18"
              width="18"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
