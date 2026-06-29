from app.core.validation import validate_file_signature


def test_pdf_valido(tmp_path):
    p = tmp_path / "doc.pdf"
    p.write_bytes(b"%PDF-1.7\n...contenido...")
    assert validate_file_signature(str(p), ".pdf") is True


def test_pdf_disfrazado_es_rechazado(tmp_path):
    p = tmp_path / "doc.pdf"
    p.write_bytes(b"esto no es un pdf")
    assert validate_file_signature(str(p), ".pdf") is False


def test_docx_es_contenedor_zip(tmp_path):
    p = tmp_path / "doc.docx"
    p.write_bytes(b"PK\x03\x04resto-del-zip")
    assert validate_file_signature(str(p), ".docx") is True


def test_texto_plano_valido(tmp_path):
    p = tmp_path / "nota.txt"
    p.write_text("contenido de texto plano", encoding="utf-8")
    assert validate_file_signature(str(p), ".txt") is True


def test_texto_con_bytes_nulos_es_rechazado(tmp_path):
    p = tmp_path / "nota.txt"
    p.write_bytes(b"texto\x00binario disfrazado")
    assert validate_file_signature(str(p), ".txt") is False
