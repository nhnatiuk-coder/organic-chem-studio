import express from "express";
import { fileURLToPath } from "node:url";
import { middleware } from "./dist/server/index.mjs";

const app = express();
app.disable("x-powered-by");

// Static resources include Ketcher's local WebAssembly chemistry engine.
app.use(
  express.static(fileURLToPath(new URL("./dist/client", import.meta.url)), {
    index: false,
  }),
);
app.use(middleware);

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Organic Chem Studio listening on port ${port}`);
});
