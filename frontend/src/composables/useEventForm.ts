import { ref } from "vue";
import type { Event, EventPayload } from "../api/events";

export interface EventFormErrors {
  title?: string;
  description?: string;
  category?: string;
  dateTime?: string;
  address?: string;
  city?: string;
  coordinates?: string;
  capacity?: string;
}

export function useEventForm() {
  const title = ref("");
  const description = ref("");
  const category = ref("");
  const dateTime = ref("");
  const address = ref("");
  const city = ref("");
  const longitude = ref("");
  const latitude = ref("");
  const capacity = ref("");
  const errors = ref<EventFormErrors>({});

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
    if (!city.value.trim()) e.city = "City is required";

    if (!longitude.value || !latitude.value) {
      e.coordinates = "Longitude and latitude are required";
    } else if (isNaN(parseFloat(longitude.value)) || isNaN(parseFloat(latitude.value))) {
      e.coordinates = "Enter valid numbers";
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
    return {
      title: title.value.trim(),
      description: description.value.trim(),
      category: category.value,
      dateTime: new Date(dateTime.value).toISOString(),
      address: address.value.trim(),
      city: city.value.trim(),
      coordinates: [parseFloat(longitude.value), parseFloat(latitude.value)],
      capacity: Number(capacity.value),
    };
  }

  function fill(event: Event) {
    title.value = event.title;
    description.value = event.description;
    category.value = event.category;
    dateTime.value = event.dateTime.slice(0, 16);
    address.value = event.address;
    city.value = event.city;
    longitude.value = String(event.coordinates[0]);
    latitude.value = String(event.coordinates[1]);
    capacity.value = String(event.capacity);
  }

  return {
    title, description, category, dateTime,
    address, city, longitude, latitude, capacity,
    errors, validate, toPayload, fill,
  };
}
