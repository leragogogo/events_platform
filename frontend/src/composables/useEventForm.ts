import { ref, computed, watch } from "vue";
import type { Event, EventPayload } from "../api/events";
import { geocodeAddress, type GeocodeResult } from "../api/geocoding";

export interface EventFormErrors {
  title?: string;
  description?: string;
  category?: string;
  dateTime?: string;
  address?: string;
  coordinates?: string;
  capacity?: string;
}

export function useEventForm() {
  const title = ref("");
  const description = ref("");
  const category = ref("");
  const dateTime = ref("");
  const address = ref("");
  const capacity = ref("");
  const errors = ref<EventFormErrors>({});

  const geocodedResult = ref<GeocodeResult | null>(null);
  const isGeocoding = ref(false);
  const geocodeError = ref("");
  const lastGeocodedAddress = ref("");

  // Needs geocoding when address is non-empty AND we don't already have valid
  // coordinates for exactly this address. Mirrors the skip condition in handleAddressBlur.
  const needsGeocode = computed(
    () =>
      address.value.trim() !== "" &&
      (geocodedResult.value === null || address.value.trim() !== lastGeocodedAddress.value)
  );

  // Clear each field's error as soon as the user edits it so stale error
  // messages don't linger after the field has been corrected.
  watch(title,       () => { errors.value.title       = undefined; });
  watch(description, () => { errors.value.description = undefined; });
  watch(category,    () => { errors.value.category    = undefined; });
  watch(dateTime,    () => { errors.value.dateTime    = undefined; });
  watch(capacity,    () => { errors.value.capacity    = undefined; });
  watch(address, () => {
    errors.value.address     = undefined;
    errors.value.coordinates = undefined;
    geocodeError.value       = "";
  });

  async function handleAddressBlur() {
    const trimmed = address.value.trim();
    // Skip only when we already have valid coordinates for this exact address.
    if (!trimmed || (geocodedResult.value !== null && trimmed === lastGeocodedAddress.value)) return;
    geocodeError.value = "";
    geocodedResult.value = null;
    isGeocoding.value = true;
    try {
      const result = await geocodeAddress(trimmed);
      if (result) {
        geocodedResult.value = result;
        lastGeocodedAddress.value = trimmed;
      } else {
        geocodeError.value = "Address not found. Try a more specific address.";
      }
    } catch {
      geocodeError.value = "Geocoding failed. Check your connection and try again.";
    } finally {
      isGeocoding.value = false;
    }
  }

  function validate(): boolean {
    const e: EventFormErrors = {};

    if (!title.value.trim()) e.title = "Title is required";
    if (!description.value.trim()) e.description = "Description is required";
    if (!category.value) e.category = "Select a category";

    if (!dateTime.value) {
      e.dateTime = "Date and time are required";
    } else if (new Date(dateTime.value) <= new Date()) {
      e.dateTime = "Date must be in the future";
    }

    if (!address.value.trim()) e.address = "Address is required";

    if (!geocodedResult.value) {
      e.coordinates = "A valid address with geocoding is required";
    }

    if (!capacity.value) {
      e.capacity = "Capacity is required";
    } else {
      const cap = Number(capacity.value);
      if (!Number.isInteger(cap) || cap < 1) {
        e.capacity = "Capacity must be a whole number ≥ 1";
      }
    }

    errors.value = e;
    return Object.keys(e).length === 0;
  }

  function toPayload(): EventPayload {
    const { coordinates, city } = geocodedResult.value!;
    return {
      title: title.value.trim(),
      description: description.value.trim(),
      category: category.value,
      dateTime: new Date(dateTime.value).toISOString(),
      address: address.value.trim(),
      city,
      coordinates,
      capacity: Number(capacity.value),
    };
  }

  function fill(event: Event) {
    title.value = event.title;
    description.value = event.description;
    category.value = event.category;
    dateTime.value = event.dateTime.slice(0, 16);
    address.value = event.address;
    capacity.value = String(event.capacity);
    geocodedResult.value = { coordinates: event.coordinates, city: event.city };
    lastGeocodedAddress.value = event.address;
  }

  return {
    title, description, category, dateTime, address, capacity,
    errors, validate, toPayload, fill,
    geocodedResult, isGeocoding, geocodeError, needsGeocode, handleAddressBlur,
  };
}
