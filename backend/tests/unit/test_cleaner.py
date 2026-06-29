from app.ingestion.cleaner import clean_text


def test_reune_palabras_cortadas_por_guion():
    # Palabra cortada por guion al final de línea (típico de PDF).
    assert "ejemplo" in clean_text("un ejem-\nplo de texto")


def test_elimina_caracteres_de_control():
    assert "\x07" not in clean_text("texto\x07con control")


def test_colapsa_lineas_en_blanco_repetidas():
    out = clean_text("a\n\n\n\n\nb")
    assert "\n\n\n" not in out


def test_conserva_marcadores_de_pagina():
    out = clean_text("[Página 3]\nContenido de la página")
    assert "[Página 3]" in out


def test_texto_vacio():
    assert clean_text("") == ""
