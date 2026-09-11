// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const browserEventsPath = require.resolve("events/events.js");

/** Resolve Ketcher's Node assertion import before Vite externalizes it. */
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

/** Provide Ketcher's EventEmitter dependency in the browser bundle. */
const ketcherEventsShim = () => ({
  name: "ketcher-browser-events-shim",
  enforce: "pre" as const,
  resolveId(id: string) {
    return id === "node:events" ? "\0ketcher-browser-events" : undefined;
  },
  load(id: string) {
    if (id !== "\0ketcher-browser-events") return undefined;
    // Ketcher's worker uses EventEmitter beyond the small subset required to
    // render the editor. Import the actual browser package by absolute path;
    // a bare "events" import is mistaken for Node's built-in module by Vite.
    return `import EventEmitter from ${JSON.stringify(browserEventsPath)};
    export { EventEmitter };
    export default { EventEmitter };`;
  },
});

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [ketcherAssertShim(), ketcherEventsShim()],
    define: {
      // ketcher-core is built for node and references `global`.
      global: "globalThis",
    },
    resolve: {
      // ketcher-core imports node's "events"; map it to the browser implementation.
      alias: [
        { find: /^events$/, replacement: "events/events.js" },
      ],
    },
    optimizeDeps: {
      include: ["events"],
    },
  },
});
