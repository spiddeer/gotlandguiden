import { defineConfig, type Plugin } from "vite"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { fileURLToPath, URL } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"

function gutafinnPwa(): Plugin {
  return {
    name: "gutafinn-pwa",
    apply: "build" as const,
    generateBundle(_options, bundle) {
      const emittedFiles = Object.keys(bundle).map((fileName) => `/${fileName}`)
      const manifest = readFileSync(
        fileURLToPath(new URL("./src/pwa/manifest.webmanifest", import.meta.url)),
      )
      const icons = new Map(
        [192, 512].map((size) => [
          size,
          readFileSync(fileURLToPath(new URL(`./src/assets/pwa/icon-${size}.png`, import.meta.url))),
        ]),
      )
      const serviceWorkerTemplate = readFileSync(
        fileURLToPath(new URL("./src/pwa/service-worker.js", import.meta.url)),
        "utf8",
      )
      const precacheUrls = [
        "/index.html",
        "/manifest.webmanifest",
        "/pwa/icon-192.png",
        "/pwa/icon-512.png",
        ...emittedFiles,
      ].filter((value, index, values) => values.indexOf(value) === index)
      const versionHash = createHash("sha256").update(JSON.stringify(precacheUrls))
      for (const [fileName, output] of Object.entries(bundle)) {
        versionHash.update(fileName)
        versionHash.update(output.type === "chunk" ? output.code : output.source)
      }
      versionHash.update(serviceWorkerTemplate).update(manifest)
      for (const icon of icons.values()) versionHash.update(icon)
      const version = versionHash.digest("hex").slice(0, 12)
      const serviceWorker = serviceWorkerTemplate
        .replace("__BUILD_VERSION__", version)
        .replace("__PRECACHE_URLS__", JSON.stringify(precacheUrls))

      this.emitFile({ type: "asset", fileName: "sw.js", source: serviceWorker })
      this.emitFile({
        type: "asset",
        fileName: "manifest.webmanifest",
        source: manifest,
      })
      for (const size of [192, 512]) {
        this.emitFile({
          type: "asset",
          fileName: `pwa/icon-${size}.png`,
          source: icons.get(size)!,
        })
      }
    },
  }
}

export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    gutafinnPwa(),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
})
