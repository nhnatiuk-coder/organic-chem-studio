import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const browserEventsPath = require.resolve("events/events.js");
const indigoWasm = readFileSync(
  join(dirname(require.resolve("indigo-ketcher")), "indigo-ketcher-1.46.0.wasm"),
);

const ketcherWasmAsset = (): Plugin => ({
  name: "ketcher-indigo-wasm-asset",
  apply: "build" as const,
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "assets/indigo-ketcher-1.46.0.wasm",
      source: indigoWasm,
    });
  },
});

const ketcherAssertShim = () => ({
  name: "ketcher-browser-assert-shim",
  enforce: "pre" as const,
  resolveId(id: string) {
    return id === "node:assert" ? "\0ketcher-browser-assert" : undefined;
  },
  load(id: string) {
    if (id !== "\0ketcher-browser-assert") return undefined;

    return `export default function assert(value, message) {
      if (!value) throw new Error(message || "Ketcher assertion failed");
    }`;
  },
});

const ketcherEventsShim = () => ({
  name: "ketcher-browser-events-shim",
  enforce: "pre" as const,
  resolveId(id: string) {
    return id === "node:events" ? "\0ketcher-browser-events" : undefined;
  },
  load(id: string) {
    if (id !== "\0ketcher-browser-events") return undefined;

    return `import EventEmitter from ${JSON.stringify(browserEventsPath)};
      export { EventEmitter };
      export default { EventEmitter };`;
  },
});

export default defineConfig({
  // Express owns the listening socket; Nitro exports a Node middleware handler.
  nitro: {
    preset: "node-middleware",
    output: { dir: "dist", publicDir: "dist/client", serverDir: "dist/server" },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [ketcherAssertShim(), ketcherEventsShim(), ketcherWasmAsset()],
    define: {
      global: "globalThis",
    },
    resolve: {
      alias: [{ find: /^events$/, replacement: "events/events.js" }],
    },
    optimizeDeps: {
      include: ["events"],
    },
  },
});
