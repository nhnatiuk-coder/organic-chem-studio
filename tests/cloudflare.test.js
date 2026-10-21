import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

test("Cloudflare deployment resolves its generated Worker and local assets", () => {
  const configPath = fileURLToPath(new URL("../.output/server/wrangler.json", import.meta.url));
  assert.ok(existsSync(configPath), "Cloudflare deploy requires .output/server/wrangler.json");
  assert.ok(
    !existsSync(resolve(dirname(configPath), "assets/indigo-ketcher-1.46.0.wasm")),
    "Browser chemistry engine must be served as a static asset, not a Worker module",
  );
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.ok(config.main, "Wrangler must have a Worker entry point");
  assert.ok(statSync(resolve(dirname(configPath), config.main)).isFile());
  assert.ok(config.compatibility_flags.includes("nodejs_compat"));
  assert.equal(config.assets.binding, "ASSETS");
  const assetsPath = resolve(dirname(configPath), config.assets.directory);
  assert.ok(statSync(assetsPath).isDirectory());
  const wasm = readFileSync(resolve(assetsPath, "assets/indigo-ketcher-1.46.0.wasm"));
  assert.deepEqual([...wasm.subarray(0, 4)], [0, 97, 115, 109]);
});
