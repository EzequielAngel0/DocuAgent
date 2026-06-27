"""Configuración de logging estructurado con structlog.

`configure_logging()` se llama una sola vez al arrancar la app. El resto
del código obtiene un logger con `get_logger(__name__)` y emite eventos
con campos clave-valor (`logger.info("evento", documento_id=...)`).

En desarrollo la salida es coloreada y legible; en producción
(`LOG_JSON=true`) se emite JSON apto para agregadores de logs.
"""
import logging
import sys

import structlog

from app.core.config import settings

_CONFIGURED = False


def configure_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.LOG_JSON:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=False)

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    _CONFIGURED = True


def get_logger(name: str = "docuagent") -> structlog.stdlib.BoundLogger:
    if not _CONFIGURED:
        configure_logging()
    return structlog.get_logger(name)
