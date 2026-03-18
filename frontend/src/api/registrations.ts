import client from "./client";

export interface Registration {
  _id: string;
  userId: string;
  eventId: string;
  createdAt: string;
}

export function createRegistration(eventId: string) {
  return client.post<{ registration: Registration }>("/registrations", { eventId });
}

export function cancelRegistration(id: string) {
  return client.delete(`/registrations/${id}`);
}
