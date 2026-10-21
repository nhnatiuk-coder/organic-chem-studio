import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";
import { test } from "node:test";

test("production server uses Azure PORT and serves pages and Ketcher assets", async (t) => {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));

  let output = "";
  const server = spawn(process.execPath, ["server.js"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, NODE_ENV: "production", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => (output += chunk));
  server.stderr.on("data", (chunk) => (output += chunk));
  t.after(async () => {
    if (server.exitCode === null) {
      const exited = once(server, "exit");
      server.kill();
      await exited;
    }
  });

  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(2000) });
      await response.arrayBuffer();
      ready = true;
      break;
    } catch {
      await setTimeout(100);
    }
  }
  assert.ok(ready, `Server did not start on the assigned PORT.\n${output}`);

  for (const path of ["/", "/practice", "/practice/run", "/results"]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, `${path}: ${await response.clone().text()}`);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(await response.text(), /<html/);
  }

  const home = await fetch(origin).then((response) => response.text());
  const stylesheet = home.match(/href="([^"]+\.css)"/);
  assert.ok(stylesheet, "Rendered page must reference a production stylesheet");
  const css = await fetch(new URL(stylesheet[1], origin));
  assert.equal(css.status, 200);
  assert.match(css.headers.get("content-type"), /text\/css/);

  const wasm = await fetch(`${origin}/assets/indigo-ketcher-1.46.0.wasm`);
  assert.equal(wasm.status, 200);
  assert.match(wasm.headers.get("content-type"), /application\/wasm/);
  assert.deepEqual([...new Uint8Array(await wasm.arrayBuffer()).slice(0, 4)], [0, 97, 115, 109]);

  assert.equal((await fetch(`${origin}/instructor`)).status, 404);
  assert.equal((await fetch(`${origin}/this-page-does-not-exist`)).status, 404);
});
