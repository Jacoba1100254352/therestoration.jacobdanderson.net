import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import process from "node:process";
import puppeteer from "puppeteer";
// eslint-disable-next-line antfu/no-import-dist -- Test the compiled production server, not development middleware.
import { createApp } from "../back-end/dist/app.js";

const require = createRequire(import.meta.url);
const axeSourcePath = require.resolve("axe-core/axe.min.js");
const routes = ["/", "/about", "/events", "/figures", "/map", "/contact", "/missing-page"];
const chromePath = [
	process.env.PUPPETEER_EXECUTABLE_PATH,
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/Applications/Chromium.app/Contents/MacOS/Chromium",
	"/usr/bin/google-chrome-stable",
	"/usr/bin/google-chrome",
	"/usr/bin/chromium"
].find(candidate => candidate && existsSync(candidate));
const app = createApp({ staticRoot: resolve(import.meta.dirname, "../front-end/dist") });
const server = app.listen(0, "127.0.0.1");
await new Promise((resolveListen, reject) => {
	server.once("listening", resolveListen);
	server.once("error", reject);
});
const baseUrl = `http://127.0.0.1:${server.address().port}`;
let browser;
const failures = [];

async function checkAccessibility(page, label) {
	const violations = await page.evaluate(async () => {
		const result = await globalThis.axe.run(document, {
			resultTypes: ["violations"],
			runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }
		});
		return result.violations.map(({ id, help, nodes }) => ({ id, help, targets: nodes.map(node => node.target) }));
	});
	assert.deepEqual(violations, [], `${label}: ${JSON.stringify(violations)}`);
	assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: horizontal overflow`);
}

try {
	browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
	for (const width of [1280, 390]) {
		for (const scheme of ["light", "dark"]) {
			for (const route of routes) {
				const label = `${route} ${width}px ${scheme}`;
				const page = await browser.newPage();
				const errors = [];
				page.on("pageerror", error => errors.push(error.message));
				page.on("response", (response) => {
					if (response.url().startsWith(baseUrl) && !response.request().isNavigationRequest() && response.status() >= 400) {
						errors.push(`${response.status()} ${response.url()}`);
					}
				});
				try {
					await page.setCacheEnabled(false);
					await page.setViewport({ width, height: 900 });
					await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }, { name: "prefers-reduced-motion", value: "reduce" }]);
					await page.setRequestInterception(true);
					page.on("request", (request) => {
						// Keep analytics and map tiles deterministic without sending visitor traffic.
						if (/^https?:/u.test(request.url()) && !request.url().startsWith(baseUrl)) {
							void request.respond({ status: 204 });
						}
						else { void request.continue(); }
					});
					const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle0" });
					assert.equal(response.status(), route === "/missing-page" ? 404 : 200, label);
					await page.waitForSelector("h1");
					if (route === "/map") await page.waitForSelector(".leaflet-marker-icon");
					await page.addScriptTag({ path: axeSourcePath });
					await checkAccessibility(page, label);
					if (width === 390 && route !== "/missing-page") {
						await page.focus(".hamburger");
						await page.keyboard.press("Enter");
						await page.waitForSelector(".hamburger[aria-expanded=\"true\"]");
						await checkAccessibility(page, `${label} menu open`);
						await page.keyboard.press("Tab");
						assert.ok(await page.evaluate(() => !!document.activeElement?.closest("#main-navigation")), `${label}: keyboard cannot reach navigation`);
						await page.keyboard.press("Escape");
						assert.ok(await page.$eval(".hamburger", element => element === document.activeElement && element.getAttribute("aria-expanded") === "false"), `${label}: Escape must close menu and return focus`);
						await page.keyboard.press("Space");
						await page.waitForSelector(".hamburger[aria-expanded=\"true\"]");
						await page.keyboard.press("Escape");
					}
					if (route === "/") {
						await page.focus(".skip-link");
						await page.keyboard.press("Enter");
						assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content", `${label}: skip link must move focus`);
						await page.evaluate(() => {
							document.activeElement?.blur();
							window.scrollTo(0, 0);
						});
						if (scheme === "light" && process.env.AUDIT_SCREENSHOT_DIR) {
							await mkdir(process.env.AUDIT_SCREENSHOT_DIR, { recursive: true });
							await page.screenshot({ path: resolve(process.env.AUDIT_SCREENSHOT_DIR, `after-${width === 1280 ? "desktop" : "mobile"}.png`) });
						}
					}
					assert.deepEqual(errors, [], `${label}: browser or local resource errors`);
					console.log(`a11y ok: ${label}`);
				}
				catch (error) { failures.push(`${label}: ${error.message}`); }
				finally { await page.close(); }
			}
		}
	}
	if (failures.length) throw new Error(failures.join("\n"));
}
finally {
	await browser?.close();
	await new Promise(resolveClose => server.close(resolveClose));
}
