import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const port = 4174;
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) resolve();
          else retry();
        })
        .on("error", retry);
    };

    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(tick, 500);
    };

    tick();
  });
}

async function main() {
  const server = spawn(process.execPath, [viteBin, "dev", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: root,
    stdio: "ignore",
  });

  try {
    await waitForServer(`http://127.0.0.1:${port}/index.html`);

    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error(`browser console error: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.error(`browser pageerror: ${err.message}`);
    });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.getElementById("hud-map")?.textContent === "map01");

    await page.evaluate(() => {
      const gs = window.gameState;
      const ws = window.worldScene;
      gs.profile.currentShip = "starter_shuttle";
      gs.profile.position = { x: 1100, y: 1100 };
      gs.profile.fuel = 200;
      gs.profile.ammo = 30;
      gs.marketOpen = false;
      ws.ship.setPosition(1100, 1100);
      ws.ship.rotation = 0;
      ws.stationProximity = null;
      ws.setShipTexture();
    });
    const combatResult = await page.evaluate(() => {
      const ws = window.worldScene;
      const before = window.gameState.profile.ammo;
      const fired = ws.firePrimaryWeapon();
      return {
        before,
        after: window.gameState.profile.ammo,
        fired,
        projectiles: ws.projectiles.length,
      };
    });
    if (!combatResult.fired || combatResult.before !== 30 || combatResult.after !== 29 || combatResult.projectiles !== 1) {
      throw new Error(`Combat smoke failed: ${JSON.stringify(combatResult)}`);
    }
    const expectedAmmoLabel = await page.evaluate(() => `${window.gameState.profile.ammo}/${window.gameState.currentShip.ammoCapacity}`);
    await page.waitForFunction((expected) => document.getElementById("hud-ammo")?.textContent === expected, expectedAmmoLabel);

    await page.evaluate(() => {
      const gs = window.gameState;
      const ws = window.worldScene;
      gs.profile.currentMap = "map01";
      gs.profile.currentShip = "starter_shuttle";
      gs.profile.position = { x: 420, y: 440 };
      ws["buildMap"]();
      ws.ship.setPosition(420, 440);
      ws.ship.rotation = 0;
      ws.stationProximity = "st_map01";
    });
    await page.waitForTimeout(200);
    await page.keyboard.press("E");
    await page.waitForFunction(() => !document.getElementById("market-panel")?.classList.contains("hidden"));
    await page.keyboard.press("R");
    await page.waitForFunction(() => document.getElementById("market-panel")?.classList.contains("hidden"));

    await page.keyboard.press("E");
    await page.waitForFunction(() => !document.getElementById("market-panel")?.classList.contains("hidden"));
    const foodBuyButton = page.locator('[data-buy="food"]').first();
    const creditsBeforeFood = await page.evaluate(() => window.gameState.profile.credits);
    await foodBuyButton.click();
    await page.waitForFunction((before) => window.gameState.profile.credits < before, creditsBeforeFood);
    await page.keyboard.press("R");
    await page.waitForFunction(() => document.getElementById("market-panel")?.classList.contains("hidden"));

    await page.evaluate(() => {
      const gs = window.gameState;
      const ws = window.worldScene;
      gs.profile.currentMap = "map01";
      gs.marketOpen = false;
      gs.profile.position = { x: 390, y: 2790 };
      ws["buildMap"]();
      ws.ship.setPosition(390, 2790);
      ws.ship.rotation = 0;
      ws.stationProximity = null;
    });
    await page.waitForFunction(() => document.getElementById("hud-map")?.textContent === "map12");

    await page.evaluate(() => {
      const gs = window.gameState;
      const ws = window.worldScene;
      gs.profile.position = { x: 3600, y: 2700 };
      ws.ship.setPosition(3600, 2700);
      ws.ship.rotation = 0;
      ws.stationProximity = "st_map12";
    });
    await page.waitForTimeout(200);
    await page.keyboard.press("E");
    await page.waitForFunction(() => !document.getElementById("market-panel")?.classList.contains("hidden"));
    await page.keyboard.press("R");
    await page.waitForFunction(() => document.getElementById("market-panel")?.classList.contains("hidden"));

    await page.evaluate(() => {
      const ws = window.worldScene;
      window.gameState.profile.currentMap = "map12";
      window.gameState.marketOpen = false;
      ws.ship.setPosition(360, 2800);
      ws.stationProximity = null;
    });
    await page.waitForFunction(() => document.getElementById("hud-map")?.textContent === "map11");

    await page.evaluate(() => {
      const ws = window.worldScene;
      window.gameState.profile.currentMap = "map11";
      window.gameState.marketOpen = false;
      ws.ship.setPosition(380, 420);
      ws.stationProximity = null;
    });
    await page.waitForFunction(() => document.getElementById("hud-map")?.textContent === "map10");

    await page.keyboard.press("N");
    await page.waitForFunction(() => document.getElementById("hud-map")?.textContent === "map01");
    await page.waitForFunction(() => document.getElementById("hud-fuel")?.textContent === "200/260");
    await page.waitForFunction(() => window.gameState.profile.currentShip === "starter_shuttle");
    await page.waitForFunction(() => {
      const raw = localStorage.getItem("open-world-space-tycoon-profile-v1");
      if (!raw) return true;
      try {
        const profile = JSON.parse(raw);
        return profile.currentMap === "map01"
          && profile.currentShip === "starter_shuttle"
          && profile.fuel === 200
          && profile.ammo === 30;
      } catch {
        return false;
      }
    });

    await browser.close();
    console.log("Smoke game test passed: market, gate travel, shipyard flow, and new game reset succeeded.");
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
