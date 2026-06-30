import app.core.turnstile as mod
from app.core.turnstile import TurnstileGate


def test_gate_verifica_marca_y_expira(monkeypatch):
    t = {"now": 100.0}
    monkeypatch.setattr(mod.time, "monotonic", lambda: t["now"])

    gate = TurnstileGate(ttl_seconds=60)
    assert not gate.is_verified("1.2.3.4")

    gate.mark_verified("1.2.3.4")
    assert gate.is_verified("1.2.3.4")

    t["now"] += 61  # pasa el TTL
    assert not gate.is_verified("1.2.3.4")


def test_gate_ips_independientes():
    gate = TurnstileGate(ttl_seconds=60)
    gate.mark_verified("a")
    assert gate.is_verified("a")
    assert not gate.is_verified("b")
