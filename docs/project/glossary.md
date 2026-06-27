# 📖 Glosario de Términos

Términos técnicos y de negocio utilizados a lo largo del proyecto.

---

## Términos de IA / NLP

| Término | Definición |
|---------|-----------|
| **RAG** | Retrieval-Augmented Generation. Técnica que combina la búsqueda de información relevante en una base de datos con la generación de respuestas por un LLM, evitando que el modelo invente información. |
| **LLM** | Large Language Model. Modelo de lenguaje de gran escala (GPT-4, Gemini, Claude) capaz de generar texto en lenguaje natural. |
| **Embedding** | Vector numérico (cientos o miles de dimensiones) que representa el significado semántico de un texto. Textos con significados similares generan vectores cercanos en el espacio vectorial. |
| **Chunk** | Fragmento de texto resultado de dividir un documento más grande. Cada chunk se indexa independientemente para facilitar la búsqueda. |
| **Chunking** | Proceso de dividir documentos en fragmentos (chunks) más pequeños para la indexación vectorial. |
| **Chunking semántico** | Estrategia de chunking que utiliza embeddings para detectar cambios de tema, preservando mejor el contexto de cada fragmento. |
| **Reranking** | Proceso de reordenar los resultados de una búsqueda inicial usando un modelo más preciso (reranker) para mejorar la relevancia de los resultados finales. |
| **Reranker** | Modelo especializado (como Cohere Rerank) que evalúa la relevancia de un fragmento respecto a una consulta específica, reordenando los resultados por calidad. |
| **Similaridad de coseno** | Métrica que mide la similitud entre dos vectores calculando el coseno del ángulo entre ellos. Valores cercanos a 1 indican alta similitud. |
| **HNSW** | Hierarchical Navigable Small World. Algoritmo de indexación que permite búsquedas eficientes de los vectores más cercanos sin comparar uno por uno. |
| **Prompt** | Instrucción o texto de entrada que se envía al LLM para que genere una respuesta. Incluye el system prompt, el contexto y la pregunta del usuario. |
| **Alucinación** | Cuando el LLM genera información que parece plausible pero es incorrecta o inventada, no respaldada por los documentos de la base. |
| **Token** | Unidad mínima de procesamiento del LLM. Puede ser una palabra, parte de una palabra o un carácter especial. Los costos de API se miden en tokens. |
| **OCR** | Optical Character Recognition. Tecnología para extraer texto de imágenes o documentos escaneados. |
| **Fallback** | Comportamiento alternativo cuando la operación principal no puede completarse. Por ejemplo, el agente informa que no encontró la respuesta en vez de inventarla. |

## Términos de Arquitectura

| Término | Definición |
|---------|-----------|
| **Base de datos vectorial** | Base de datos especializada en almacenar y buscar vectores (embeddings) de forma eficiente. Ejemplos: Qdrant, Pinecone, Weaviate. |
| **Pipeline** | Secuencia de pasos de procesamiento donde la salida de cada paso es la entrada del siguiente. En este proyecto: ingesta → extracción → indexación → retrieval → generación. |
| **Grafo de estado** | Modelo de ejecución donde el flujo se representa como un grafo dirigido con nodos (operaciones) y aristas (transiciones). LangGraph usa este modelo. |
| **Multi-proveedor** | Capacidad de cambiar entre diferentes proveedores de un servicio (LLM, embeddings) sin modificar el código, usando una capa de abstracción. |
| **Containerización** | Empaquetado de una aplicación con todas sus dependencias en una imagen de contenedor (Podman/Docker) para garantizar ejecución consistente en cualquier entorno. |
| **CI/CD** | Continuous Integration / Continuous Deployment. Automatización del proceso de compilación, pruebas y despliegue del código. |

## Términos de Negocio

| Término | Definición |
|---------|-----------|
| **Colaborador** | Empleado de la empresa que utiliza el agente para consultar documentación. |
| **Categoría** | Clasificación temática de los documentos (RH, Financiero, Legal, etc.). Es dinámica y configurable. |
| **Responsable (owner)** | Persona del área correspondiente que aprueba y mantiene actualizados los documentos de su categoría. |
| **Curaduría** | Proceso de revisión y selección de documentos para garantizar que solo la versión oficial y vigente esté en la base. |
| **Ingesta** | Proceso de incorporar documentos a la base de conocimiento del agente (carga → extracción → indexación). |
| **Fuente** | Ubicación original del documento (carpeta compartida, repositorio Git, carga manual). |
| **Feedback** | Retroalimentación del colaborador sobre la calidad de una respuesta del agente (positivo/negativo). |

## Acrónimos

| Acrónimo | Significado |
|----------|------------|
| **API** | Application Programming Interface |
| **ADR** | Architecture Decision Record |
| **BD** | Base de Datos |
| **CRUD** | Create, Read, Update, Delete |
| **IAM** | Identity and Access Management |
| **OCI** | Oracle Cloud Infrastructure |
| **OCIR** | OCI Container Registry |
| **OKE** | Oracle Kubernetes Engine |
| **REST** | Representational State Transfer |
| **SSR** | Server-Side Rendering |
| **VCN** | Virtual Cloud Network |
| **WS** | WebSocket |
