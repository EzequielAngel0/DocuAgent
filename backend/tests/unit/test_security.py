"""Tests de seguridad: JWT con iss/aud y sanidad de hashing."""

from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    verify_token,
)


def test_jwt_roundtrip_incluye_sub():
    token = create_access_token({"sub": "admin@empresa.com"})
    payload = verify_token(token)
    assert payload is not None
    assert payload["sub"] == "admin@empresa.com"
    assert payload["iss"] == "docuagent"
    assert payload["aud"] == "docuagent-admin"


def test_jwt_invalido_devuelve_none():
    assert verify_token("token.basura.invalido") is None


def test_password_hash_y_verify():
    h = get_password_hash("Sup3rSecreta!")
    assert h != "Sup3rSecreta!"
    assert verify_password("Sup3rSecreta!", h) is True
    assert verify_password("incorrecta", h) is False
