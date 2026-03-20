<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { RouterLink } from "vue-router";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import type { MapEvent } from "../api/events";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const props = defineProps<{ events: MapEvent[] }>();

const leafletMap = ref<L.Map | null>(null);

const DEFAULT_CENTER: [number, number] = [51, 10];
const DEFAULT_ZOOM = 4;

/** Swap [lon, lat] → [lat, lon] for Leaflet */
function toLatLon(coords: [number, number]): [number, number] {
  return [coords[1], coords[0]];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function handleMapReady(map: L.Map) {
  leafletMap.value = map;
  nextTick(() => map.invalidateSize());
}

/** Fit map to all marker bounds whenever the events list changes. */
watch(
  () => props.events,
  (evts) => {
    if (!evts.length || !leafletMap.value) return;
    const bounds = L.latLngBounds(evts.map((e) => toLatLon(e.coordinates)));
    leafletMap.value.fitBounds(bounds, { padding: [40, 40] });
  },
  { deep: true },
);
</script>

<template>
  <div class="event-map">
    <LMap
      :center="DEFAULT_CENTER"
      :zoom="DEFAULT_ZOOM"
      :use-global-leaflet="false"
      @ready="handleMapReady"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <LMarker
        v-for="event in events"
        :key="event._id"
        :lat-lng="toLatLon(event.coordinates)"
      >
        <LPopup>
          <div class="map-popup">
            <p class="map-popup__title">{{ event.title }}</p>
            <p class="map-popup__meta">{{ formatDate(event.dateTime) }} · {{ event.city }}</p>
            <RouterLink
              :to="{ name: 'event-detail', params: { id: event._id } }"
              class="map-popup__link"
            >View event →</RouterLink>
          </div>
        </LPopup>
      </LMarker>
    </LMap>
  </div>
</template>

<style scoped>
.event-map {
  width: 100%;
  height: 400px;
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.map-popup {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
}

.map-popup__title {
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
  color: #111;
}

.map-popup__meta {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.map-popup__link {
  font-size: 0.75rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.map-popup__link:hover {
  text-decoration: underline;
}
</style>
