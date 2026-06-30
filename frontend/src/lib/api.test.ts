import { describe, expect, it, vi } from "vitest";

import { API_BASE, apiFetch } from "./api";

describe("apiFetch", () => {
  it("antepone la base y envía credentials:include", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/admin/categories", { method: "GET" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/admin/categories`,
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });

  it("respeta opciones adicionales sin perder credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/admin/documents/upload", { method: "POST", body: "x" });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.credentials).toBe("include");
    expect(options.method).toBe("POST");
  });
});
