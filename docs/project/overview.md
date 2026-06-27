# 📋 Visión General del Proyecto

## Nombre del Proyecto

**DocuAgent** — Agente RAG de Documentación Empresarial

## Problema

En las empresas, la documentación interna (políticas de RH, contratos, procedimientos, normativas) se encuentra dispersa en múltiples fuentes y formatos. Los colaboradores pierden tiempo buscando información manualmente, consultan documentos desactualizados o simplemente no encuentran lo que necesitan, lo que genera:

- **Pérdida de productividad** — Tiempo invertido buscando documentos en lugar de trabajar
- **Información incorrecta** — Uso de versiones antiguas de políticas o procedimientos
- **Dependencia de personas** — Preguntas constantes al área de RH, Legal o Financiero
- **Falta de trazabilidad** — No se sabe qué información consultó cada colaborador

## Solución

Un **agente de IA conversacional** basado en **RAG (Retrieval-Augmented Generation)** que:

1. **Centraliza** toda la documentación corporativa en una base de conocimiento unificada
2. **Permite consultas en lenguaje natural** — El colaborador pregunta como si hablara con un colega
3. **Responde con citación de fuentes** — Cada respuesta indica exactamente de qué documento proviene
4. **Opera en múltiples idiomas** — Español, inglés y portugués
5. **Se mantiene actualizado** — Pipeline automático de actualización de documentos

## Objetivos del Proyecto

### Objetivos Principales
- [ ] Construir un agente RAG funcional con pipeline completo (ingesta → respuesta)
- [ ] Implementar búsqueda semántica multilingüe sobre documentos corporativos
- [ ] Desplegar el agente en Oracle Cloud Infrastructure (OCI)
- [ ] Documentar y registrar la ejecución del proyecto

### Objetivos Secundarios
- [ ] Crear una interfaz web profesional y funcional
- [ ] Implementar sistema de feedback de usuarios
- [ ] Establecer pipeline de CI/CD automatizado
- [ ] Implementar monitoreo y observabilidad con LangSmith

## Alcance

### En Alcance (In Scope)
- Pipeline RAG completo: ingesta, extracción, chunking, indexación, retrieval, generación
- Soporte multi-formato: PDF, Word, Excel, Markdown, CSV, JSON, texto plano
- Soporte multilingüe: español, inglés, portugués
- Interfaz web conversacional con historial de sesión
- Carga manual de documentos + integración con repositorios Git
- Categorización dinámica de documentos
- Citación de fuentes en cada respuesta
- Control de alucinaciones y fallback cuando no hay respuesta
- Despliegue containerizado con Podman en OCI
- Observabilidad con LangSmith
- Landing page profesional

### Fuera de Alcance (Out of Scope)
- Integración con Slack, Microsoft Teams u otras plataformas de mensajería
- Sistema de autenticación / SSO corporativo
- Integración directa con Google Drive o SharePoint (futuro)
- OCR para PDFs escaneados (se planea como mejora futura)
- Edición o creación de documentos desde el agente
- Procesamiento de audio o video

## Usuarios Objetivo

- **Colaboradores de la empresa** — Consultan documentación interna
- **Administradores de documentos** — Cargan y categorizan documentos
- **Áreas responsables** (RH, Legal, etc.) — Curan y aprueban contenido

## Métricas de Éxito

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Tasa de respuesta | > 80% de preguntas con respuesta relevante | LangSmith traces |
| Precisión de fuentes | > 90% de respuestas con fuente correcta | Feedback usuarios |
| Tiempo de respuesta | < 10 segundos por consulta | Métricas de API |
| Satisfacción | > 70% feedback positivo | Botón de feedback |
| Disponibilidad | > 99% uptime en producción | Monitoreo OCI |

## Contexto del Proyecto

Este proyecto se desarrolla como parte del programa de formación en IA de **Alura LATAM**, siguiendo las 8 fases definidas en las tarjetas del proyecto:

1. Colecta y organización de documentos
2. Procesamiento y extracción de contenido
3. Indexación vectorial
4. Capa de recuperación (RAG)
5. Producción y validación de respuestas
6. Implantación, interfaz y mantenimiento
7. Deploy en la nube (OCI)
8. Registro de ejecución del proyecto
