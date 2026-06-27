import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Importar configuración y modelos para autogeneración
from app.core.config import settings
from app.db.models import Base

# Este es el objeto de configuración de Alembic, que proporciona
# acceso a los valores dentro del archivo .ini en uso.
config = context.config

# Interpretar el archivo de configuración para el registro (logging).
# Esta línea configura los loggers básicamente.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Configurar metadatos del target para soporte de autogeneración ('alembic revision --autogenerate')
target_metadata = Base.metadata

# Sobrescribir la URL de base de datos con la definida en la configuración de la app
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)


def run_migrations_offline() -> None:
    """Ejecutar migraciones en modo 'offline'.

    Esto configura el contexto solo con una URL y no con un Engine.
    Llamadas a context.execute() aquí emitirán la cadena SQL a la salida del script.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Ejecutar migraciones en modo 'online'.

    En este escenario necesitamos crear una conexión asíncrona
    y asociar la transacción con la migración.
    """
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = settings.DATABASE_URL
    
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
