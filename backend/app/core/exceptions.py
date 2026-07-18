"""Excepciones de dominio de DocuAgent.

Permiten distinguir fallos de negocio (recuperables, mapeables a códigos
HTTP) de errores inesperados. Se registran y traducen en la capa de API.
"""


class DocuAgentError(Exception):
    """Error base de la aplicación."""

    status_code: int = 500
    detail: str = "Error interno del servicio."

    def __init__(self, detail: str | None = None) -> None:
        if detail:
            self.detail = detail
        super().__init__(self.detail)


class IngestionError(DocuAgentError):
    """Fallo durante la extracción/limpieza/chunking/indexado de un documento."""

    status_code = 422
    detail = "No se pudo procesar el documento."


class UnsupportedFormatError(IngestionError):
    status_code = 415
    detail = "Formato de archivo no soportado."


class FileTooLargeError(IngestionError):
    status_code = 413
    detail = "El archivo excede el tamaño máximo permitido."


class RetrievalError(DocuAgentError):
    """Fallo al recuperar o reordenar fragmentos de la base vectorial."""

    status_code = 503
    detail = "La capa de recuperación no está disponible."


class LLMProviderError(DocuAgentError):
    """Ningún proveedor LLM de la cadena de fallback respondió."""

    status_code = 503
    detail = "El proveedor de lenguaje no está disponible."


class PromptInjectionError(DocuAgentError):
    """La entrada del usuario fue marcada como intento de inyección."""

    status_code = 400
    detail = "La consulta contiene instrucciones no permitidas."
