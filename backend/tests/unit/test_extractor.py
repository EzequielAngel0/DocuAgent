import json

import pytest

from app.core.exceptions import UnsupportedFormatError
from app.ingestion.extractors import DocumentExtractor


def test_extract_text_file(tmp_path):
    file_path = tmp_path / "sample.txt"
    file_path.write_text("Este es un texto de prueba para el extractor.", encoding="utf-8")

    content = DocumentExtractor.extract_text(str(file_path))
    assert "texto de prueba" in content


def test_extract_markdown_file(tmp_path):
    file_path = tmp_path / "sample.md"
    file_path.write_text("# Título de Política\n\n- Punto 1\n- Punto 2", encoding="utf-8")

    content = DocumentExtractor.extract_text(str(file_path))
    assert "# Título de Política" in content
    assert "Punto 1" in content


def test_extract_csv_file(tmp_path):
    file_path = tmp_path / "sample.csv"
    file_path.write_text(
        "Nombre,Departamento,Salario\nJuan,RH,5000\nMaria,Finanzas,6000",
        encoding="utf-8",
    )

    content = DocumentExtractor.extract_text(str(file_path))
    assert "Juan, RH, 5000" in content
    assert "Maria, Finanzas, 6000" in content


def test_extract_json_file(tmp_path):
    file_path = tmp_path / "sample.json"
    file_path.write_text(json.dumps({"empresa": "DocuAgent Inc", "version": 1.0}), encoding="utf-8")

    content = DocumentExtractor.extract_text(str(file_path))
    assert "DocuAgent Inc" in content


def test_extract_unsupported_file(tmp_path):
    file_path = tmp_path / "sample.unknown"
    file_path.write_text("contenido", encoding="utf-8")

    with pytest.raises(UnsupportedFormatError, match="no soportada"):
        DocumentExtractor.extract_text(str(file_path))
