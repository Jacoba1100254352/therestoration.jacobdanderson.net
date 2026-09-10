import { createApp, h, nextTick, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import MapComponent from "../src/components/MapComponent.vue";

describe("map updates", () => {
	it("replaces markers when coordinates change and treats popup text literally", async () => {
		const location = {
			name: "Palmyra, New York",
			latitude: 43.0631,
			longitude: -77.2332,
			events: ["The First Vision"],
			figures: ["Joseph Smith"],
			imageUrl: "/images/place.jpg"
		};
		const coordinates = ref([location]);
		const root = document.createElement("div");
		document.body.append(root);
		const app = createApp({ render: () => h(MapComponent, { coordinates: coordinates.value }) });
		app.mount(root);
		try {
			await vi.waitFor(() => expect(root.querySelectorAll(".leaflet-marker-icon")).toHaveLength(1));
			coordinates.value = [{ ...location, name: "<em>Updated location</em>" }];
			await nextTick();
			expect(root.querySelectorAll(".leaflet-marker-icon")).toHaveLength(1);
			root.querySelector<HTMLElement>(".leaflet-marker-icon")!.click();
			expect(root.querySelector(".leaflet-popup-content")?.textContent).toContain("<em>Updated location</em>");
			expect(root.querySelector(".leaflet-popup-content em")).toBeNull();
			coordinates.value = [];
			await nextTick();
			expect(root.querySelectorAll(".leaflet-marker-icon")).toHaveLength(0);
		} finally {
			app.unmount();
			root.remove();
		}
	});
});
