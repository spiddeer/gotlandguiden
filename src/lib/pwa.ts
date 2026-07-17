export async function registerServiceWorker(enabled = import.meta.env.PROD) {
  if (!enabled || typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }

  try {
    return await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
  } catch {
    return null
  }
}
