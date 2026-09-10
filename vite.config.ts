import { defineConfig } from "@lovable.dev/vite-tanstack-config";

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
    return `export class EventEmitter {
      constructor() { this._events = new Map(); }
      on(event, listener) { const items = this._events.get(event) || []; items.push(listener); this._events.set(event, items); return this; }
      addListener(event, listener) { return this.on(event, listener); }
      once(event, listener) { const once = (...args) => { this.removeListener(event, once); listener(...args); }; return this.on(event, once); }
      off(event, listener) { return this.removeListener(event, listener); }
      removeListener(event, listener) { const items = this._events.get(event) || []; this._events.set(event, items.filter((item) => item !== listener)); return this; }
      removeAllListeners(event) { event === undefined ? this._events.clear() : this._events.delete(event); return this; }
      emit(event, ...args) { const items = this._events.get(event) || []; items.slice().forEach((listener) => listener(...args)); return items.length > 0; }
      listeners(event) { return [...(this._events.get(event) || [])]; }
      listenerCount(event) { return (this._events.get(event) || []).length; }
    }
    EventEmitter.listenerCount = (emitter, event) => emitter.listenerCount(event);
    export default { EventEmitter };`;
  },
});

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [ketcherAssertShim(), ketcherEventsShim()],
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
