import { afterEach, describe, expect, it, vi } from "vitest"

import { registerServiceWorker } from "@/lib/pwa"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("PWA registration", () => {
  it("registers the stable service-worker URL without HTTP cache reuse", async () => {
    const registration = { scope: "/" }
    const register = vi.fn().mockResolvedValue(registration)
    vi.stubGlobal("navigator", { serviceWorker: { register } })

    await expect(registerServiceWorker(true)).resolves.toBe(registration)
    expect(register).toHaveBeenCalledWith("/sw.js", { updateViaCache: "none" })
  })

  it("stays inert outside production and absorbs registration failures", async () => {
    const register = vi.fn().mockRejectedValue(new Error("blocked"))
    vi.stubGlobal("navigator", { serviceWorker: { register } })

    await expect(registerServiceWorker(false)).resolves.toBeNull()
    expect(register).not.toHaveBeenCalled()
    await expect(registerServiceWorker(true)).resolves.toBeNull()
  })
})
