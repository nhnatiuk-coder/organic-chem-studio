import { defineConfig } from "@lovable.dev/vite-tanstack-config";

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

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [ketcherAssertShim()],
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
