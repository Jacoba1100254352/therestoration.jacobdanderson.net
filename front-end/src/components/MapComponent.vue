<script lang="ts" setup>
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

interface Location {
	latitude: number;
	longitude: number;
	name: string;
	events: string[];
	figures: string[];
	imageUrl: string;
	imgAlt?: string;
}

const props = withDefaults(defineProps<{ coordinates?: Location[] }>(), { coordinates: () => [] });
const mapContainer = ref<HTMLElement | null>(null);
let map: LeafletMap | undefined;
let markers: LayerGroup | undefined;
let leaflet: typeof import("leaflet") | undefined;

function updateMarkers() {
	if (!markers || !leaflet) return;
	markers.clearLayers();
	for (const location of props.coordinates) {
		const content = document.createElement("div");
		const title = document.createElement("b");
		title.textContent = location.name;
		content.append(title, document.createElement("br"));
		content.append(location.events.join(", "), document.createElement("br"));
		content.append(location.figures.join(", "), document.createElement("br"));
		const image = document.createElement("img");
		image.src = location.imageUrl;
		image.alt = location.imgAlt || location.name;
		image.style.width = "100%";
		image.style.maxWidth = "300px";
		content.append(image);
		leaflet
			.marker([location.latitude, location.longitude], { title: location.name, alt: location.name })
			.bindPopup(content)
			.addTo(markers);
	}
}

// Create this watcher synchronously so Vue stops it when the component unmounts.
watch(() => props.coordinates, updateMarkers, { deep: true });

onMounted(async () => {
	const L = await import("leaflet");
	await import("leaflet/dist/leaflet.css");
	if (!mapContainer.value) return;
	leaflet = L;
	L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });
	map = L.map(mapContainer.value).setView([40.2338, -111.6585], 5);
	L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	markers = L.layerGroup().addTo(map);
	updateMarkers();
});

onBeforeUnmount(() => {
	map?.remove();
	map = undefined;
	markers = undefined;
});
</script>

<template>
	<div id="map" ref="mapContainer" role="region" aria-label="Restoration locations"></div>
</template>

<style scoped>
#map {
	height: 54vh;
	width: 100%;
}

:deep(.leaflet-control-attribution a) {
	text-decoration: underline;
}
</style>
