import { defineConfig } from "nitro/config";

export default defineConfig({
  // The root server.js launches Express after the build; it is not a Nitro handler.
  serverEntry: false,
});
