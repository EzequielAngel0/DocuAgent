# Documentos de ejemplo (seed)

Contenido **ficticio** de una empresa de ejemplo ("Corporativo Nébula") para
poblar la base de conocimiento en demos y pruebas del pipeline RAG. **No son
datos reales.** Sustitúyelos por la documentación real de la empresa cuando
corresponda.

## Estructura

Cada subcarpeta se mapea a una categoría en `seed_documents.py`:

| Carpeta | Categoría | Archivos |
|---|---|---|
| `rh/` | Recursos Humanos | política de vacaciones, reglamento interno |
| `finanzas/` | Finanzas | política de gastos y viáticos |
| `seguridad/` | Seguridad e Higiene | protocolo de emergencias |
| `general/` | General | FAQ de TI, prestaciones y beneficios |

## Cómo cargarlos (indexar en Qdrant + PostgreSQL)

**Opción A — script de seed (recomendado, reproducible).** Con el stack de
producción arriba (postgres + qdrant), desde la VM:

```bash
./ops/docuagent.sh seed
```

Es idempotente: omite los documentos ya registrados por nombre. Internamente
corre `python -m app.scripts.seed_documents` dentro del contenedor del backend,
que lee esta carpeta (`/app/documents`) y llama al pipeline de ingesta real
(extraer → limpiar → chunk → embed Cohere → upsert Qdrant + registrar en la BD).

**Opción B — panel admin (arrastrar y soltar).** Iniciar sesión en
`/admin`, ir a *Documentos*, elegir la categoría y subir cada archivo. Útil para
validar el flujo de subida end-to-end en el navegador.

## Reemplazar por documentos reales

1. Borra o vacía estas subcarpetas.
2. Coloca los documentos reales en la carpeta de su categoría (crea nuevas
   subcarpetas y añádelas a `CATEGORIES_DATA` en `seed_documents.py` si hace
   falta otra categoría).
3. Formatos soportados: PDF, DOCX, XLSX/XLS, CSV, MD, TXT, HTML, JSON.
