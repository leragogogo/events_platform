import client from "./client";

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  dateTime: string;
  address: string;
  city: string;
  coordinates: [number, number];
  capacity: number;
  createdByUserId: string;
  createdAt: string;
}

export interface EventPayload {
  title: string;
  description: string;
  category: string;
  dateTime: string;
  address: string;
  city: string;
  coordinates: [number, number];
  capacity: number;
}

export function getCategories() {
  return client.get<{ categories: string[] }>("/events/meta/categories");
}

export function getEvent(id: string) {
  return client.get<{ event: Event }>(`/events/${id}`);
}

export function getEventsByUser(userId: string) {
  return client.get<{ events: Event[] }>(`/events/user/${userId}`);
}

export function createEvent(data: EventPayload) {
  return client.post<{ event: Event }>("/events", data);
}

export function updateEvent(id: string, data: Partial<EventPayload>) {
  return client.patch<{ event: Event }>(`/events/${id}`, data);
}

export function updateEventField(id: string, field: keyof EventPayload, value: unknown) {
  return client.patch<{ event: Event }>(`/events/${id}/${field}`, { value });
}

export function deleteEvent(id: string) {
  return client.delete(`/events/${id}`);
}
