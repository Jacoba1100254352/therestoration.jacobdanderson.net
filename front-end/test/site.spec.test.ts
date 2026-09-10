import { describe, expect, it } from "vitest";
import { getPageMetadata } from "../src/site";

describe("page metadata", () => {
	it("normalizes canonical URLs for real pages", () => {
		expect(getPageMetadata("/about/")).toMatchObject({
			title: "About | The Restoration",
			canonical: "https://therestoration.jacobdanderson.net/about"
		});
	});
	it.each(["/404", "/missing", "/api", "/api/contact", "/README", "//example.com", "/toString"])(
		"excludes unknown route %s from indexing",
		path => {
			expect(getPageMetadata(path)).toMatchObject({ robots: "noindex,nofollow", canonical: undefined });
		}
	);
});
