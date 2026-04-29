import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const port = 4173;

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js") || file.endsWith(".mjs")) return "application/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

const server = http.createServer((req, res) => {
  const reqPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(root, decodeURIComponent(reqPath));
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": contentType(filePath) });
  fs.createReadStream(filePath).pipe(res);
});

function closeAndExit(code) {
  server.close(() => {
    process.exit(code);
  });
}

function fail(msg) {
  console.error(`Smoke browser test failed: ${msg}`);
  closeAndExit(1);
}

server.listen(port, async () => {
  try {
    const indexRes = await fetch(`http://127.0.0.1:${port}/index.html`);
    if (!indexRes.ok) fail("index.html not reachable");
    const html = await indexRes.text();
    if (!html.includes('id="gameCanvas"')) fail("gameCanvas element missing");

    const moduleRes = await fetch(`http://127.0.0.1:${port}/js/game.js`);
    if (!moduleRes.ok) fail("js/game.js not reachable");

    let playwright;
    try {
      playwright = await import("playwright");
    } catch {
      console.log("Smoke browser test partial pass: static server + asset checks passed. Install Playwright for interactive headless checks.");
      closeAndExit(0);
      return;
    }

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await page.waitForSelector("#gameCanvas");
    await page.click("button");
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(180);
    await page.keyboard.up("ArrowUp");
    await page.keyboard.press("Space");
    await page.waitForTimeout(120);
    const state = await page.evaluate(() => ({
      hasGame: Boolean(window.game),
      state: window.game?.gameState,
      fuel: window.game?.fuel,
    }));
    if (!state.hasGame) fail("window.game missing after load");
    if (state.state !== "playing") fail(`game did not enter playing state (${state.state})`);
    if (!(state.fuel < 1000)) fail("fuel did not decrease after thrust input");

    await browser.close();
    console.log("Smoke browser test passed: interactive headless checks succeeded.");
    closeAndExit(0);
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
});
