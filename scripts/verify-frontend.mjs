import assert from "node:assert/strict";

// Release identity alone cannot prove that the server is serving the matching static build.
export async function verifyFrontend(baseUrl) {
	const get = async (path) => {
		const response = await fetch(new URL(path, baseUrl), { redirect: "error", signal: AbortSignal.timeout(10_000) });
		return { status: response.status, text: await response.text() };
	};
	const [home, contact, sitemap, missing] = await Promise.all([
		get("/"),
		get("/contact"),
		get("/sitemap.xml"),
		get("/restoration-deployment-check-missing")
	]);
	assert.equal(home.status, 200, "The home page must load");
	assert.match(home.text, /rel="canonical"/u, "The served front end is stale: generated canonical metadata is missing");
	assert.match(home.text, /aria-label="Toggle navigation"/u, "The served front end must include accessible navigation");
	assert.equal(contact.status, 200, "The contact page must load");
	assert.match(contact.text, /<title>Contact \| The Restoration<\/title>/u, "The served contact page is stale");
	assert.equal(sitemap.status, 200, "The sitemap must load");
	const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(match => match[1]);
	assert.deepEqual(urls.sort(), ["", "about", "contact", "events", "figures", "map"].map(path => `https://therestoration.jacobdanderson.net/${path}`).sort(), "The served sitemap must describe the current public pages");
	assert.equal(missing.status, 404, "Missing pages must return 404");
	assert.match(missing.text, /Page not found/u);
	assert.match(missing.text, /noindex,nofollow/u);
}
