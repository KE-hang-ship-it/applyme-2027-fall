import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the ApplyME workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /ApplyME/);
  assert.match(html, /Dashboard/);
  assert.match(html, /kun-mech-assistant-v2\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("uses the responsive ApplyME brand and app metadata", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const manifest = await readFile(new URL("../app/manifest.ts", import.meta.url), "utf8");
  assert.match(page, /brand\/applyme-horizontal\.png/);
  assert.match(page, /brand\/applyme-icon-dark\.png/);
  assert.match(page, /brand\/applyme-icon-monochrome\.png/);
  assert.match(layout, /ApplyME \| 机械工程硕士申请/);
  assert.match(layout, /brand\/favicon-48\.png/);
  assert.match(layout, /brand\/apple-touch-icon\.png/);
  assert.match(manifest, /brand\/icon-192\.png/);
  assert.match(manifest, /brand\/icon-512\.png/);
});

test("keeps verification, backup, ranking and link safety in source", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const types = await readFile(new URL("../types/application.ts", import.meta.url), "utf8");
  const rankingBadge = await readFile(new URL("../components/programs/RankingBadge.tsx", import.meta.url), "utf8");
  const source = `${page}\n${types}`;
  assert.match(page, /programVerification\s*=\s*\(program:Program\).*overallVerification\(program\)/);
  assert.doesNotMatch(page, /programVerification\s*=\s*\(program:Program\).*program\.verified/);
  assert.match(rankingBadge, /暂无可靠公开排名/);
  assert.match(rankingBadge, /No verified ranking available/);
  assert.match(page, /exportBackup/);
  assert.match(page, /importBackup/);
  assert.match(source, /rankSource\?/);
  assert.match(source, /departmentUrl\?/);
  assert.match(page, /rel="noreferrer noopener"/);
  assert.match(page, /document\.documentElement\.lang/);
});

test("compare control is isolated from program-card navigation", async () => {
  const compareButton = await readFile(new URL("../components/programs/CompareButton.tsx", import.meta.url), "utf8");
  assert.match(compareButton, /aria-pressed/);
  assert.match(compareButton, /onPointerDown/);
  assert.match(compareButton, /stopPropagation/);
  assert.match(compareButton, /type="button"/);
});
