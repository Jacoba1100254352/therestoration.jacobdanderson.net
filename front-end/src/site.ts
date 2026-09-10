export const siteUrl = "https://therestoration.jacobdanderson.net";
export const siteDescription = "Explore the people, events, and historic places of the Latter-day Saint Restoration.";

export const pageMetadata: Record<string, { title: string; description: string }> = {
	"/": { title: "The Restoration", description: siteDescription },
	"/about": {
		title: "About | The Restoration",
		description:
			"Learn about the Digital Restoration Journey and its exploration of Latter-day Saint history and faith."
	},
	"/events": {
		title: "Key Events | The Restoration",
		description: "Explore key events in the Restoration, from the First Vision to the early growth of the Church."
	},
	"/figures": {
		title: "Key Figures | The Restoration",
		description:
			"Discover the lives and contributions of Joseph Smith, Emma Smith, and other figures in the Restoration."
	},
	"/map": {
		title: "Interactive Map | The Restoration",
		description: "Explore historic Restoration locations, with events and people connected to each place."
	},
	"/contact": {
		title: "Contact | The Restoration",
		description: "Send questions or feedback about the Digital Restoration Journey through our contact form."
	}
};

export function getPageMetadata(path: string) {
	const normalizedPath = path.replace(/\/+$/, "") || "/";
	const page = Object.hasOwn(pageMetadata, normalizedPath) ? pageMetadata[normalizedPath] : undefined;
	return {
		title: page?.title || "Page not found | The Restoration",
		description: page?.description || "This page could not be found. Return home to explore the Restoration.",
		canonical: page ? `${siteUrl}${normalizedPath}` : undefined,
		robots: page ? "index,follow,max-image-preview:large" : "noindex,nofollow"
	};
}
