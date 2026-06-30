from app.core.lockout import LoginLockout


def test_bloquea_tras_max_fallos():
    lk = LoginLockout(max_fails=3, window_seconds=60)
    assert not lk.is_locked("user@a.com")
    for _ in range(3):
        lk.record_fail("user@a.com")
    assert lk.is_locked("user@a.com")


def test_reset_desbloquea():
    lk = LoginLockout(max_fails=2, window_seconds=60)
    lk.record_fail("user@a.com")
    lk.record_fail("user@a.com")
    assert lk.is_locked("user@a.com")
    lk.reset("user@a.com")
    assert not lk.is_locked("user@a.com")


def test_claves_independientes():
    lk = LoginLockout(max_fails=1, window_seconds=60)
    lk.record_fail("a@a.com")
    assert lk.is_locked("a@a.com")
    assert not lk.is_locked("b@b.com")


def test_ventana_expira(monkeypatch):
    import app.core.lockout as mod

    t = {"now": 1000.0}
    monkeypatch.setattr(mod.time, "monotonic", lambda: t["now"])

    lk = LoginLockout(max_fails=2, window_seconds=60)
    lk.record_fail("a@a.com")
    lk.record_fail("a@a.com")
    assert lk.is_locked("a@a.com")

    t["now"] += 61  # pasa la ventana
    assert not lk.is_locked("a@a.com")
