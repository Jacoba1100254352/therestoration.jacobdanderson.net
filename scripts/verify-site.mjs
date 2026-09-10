import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../front-end/dist/", import.meta.url);
const origin = "https://therestoration.jacobdanderson.net";
const pages = ["", "about", "events", "figures", "map", "contact"];
const titles = new Set();
for (const page of [...pages, "404"]) {
	const html = await readFile(new URL(`${page || "index"}.html`, root), "utf8");
	const title = html.match(/<title>([^<]+)<\/title>/u)?.[1];
	assert.ok(title?.includes("The Restoration"), `${page}: generated title is missing`);
	assert.ok(!titles.has(title), `${page}: generated title must be unique`);
	titles.add(title);
	assert.equal((html.match(/name="description"/gu) || []).length, 1, `${page}: exactly one description required`);
	assert.equal((html.match(/name="robots"/gu) || []).length, 1, `${page}: exactly one robots tag required`);
	assert.equal((html.match(/<h1[\s>]/gu) || []).length, 1, `${page}: exactly one heading required`);
	assert.doesNotMatch(html, /favicon(?:-dark)?\.svg|rel="mask-icon"/u, `${page}: nonexistent icon reference`);
	if (page === "404") {
		assert.match(html, /<meta[^>]+content="noindex,nofollow"/u);
		assert.doesNotMatch(html, /rel="canonical"/u);
	}
	else {
		const canonical = html.match(/<link\s[^>]*rel="canonical"[^>]*>/u)?.[0];
		assert.ok(canonical?.includes(`href="${origin}/${page}"`), `${page}: production canonical missing`);
		assert.match(html, /property="og:title"/u);
		assert.match(html, /type="application\/ld\+json"/u);
	}
	for (const match of html.matchAll(/(?:src|href)="(\/(?:assets|images)\/[^"?#]+|\/favicon[^"?#]+|\/apple-touch-icon\.png)"/gu)) {
		await readFile(new URL(`.${match[1]}`, root));
	}
}
const sitemap = await readFile(new URL("sitemap.xml", root), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(match => match[1]);
assert.deepEqual(urls.sort(), pages.map(page => `${origin}/${page}`).sort());
const robots = await readFile(new URL("robots.txt", root), "utf8");
const sourceRobots = await readFile(new URL("../front-end/public/robots.txt", import.meta.url), "utf8");
assert.equal(robots, sourceRobots, "The build must preserve the site's crawler policy");
console.log("Generated pages have unique metadata, local assets, an honest 404, and the production sitemap.");
