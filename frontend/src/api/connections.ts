import client from "./client";

export type ConnectionStatus = "pending" | "approved" | "declined";

export interface ConnectionUser {
  _id: string;
  name: string;
}

export interface Connection {
  _id: string;
  requesterId: ConnectionUser;
  addresseeId: ConnectionUser;
  status: ConnectionStatus;
  createdAt: string;
}

export function initiateConnection(addresseeId: string) {
  return client.post<{ connection: Connection }>("/connections", { addresseeId });
}

export function getMyConnections() {
  return client.get<{ connections: Connection[] }>("/connections");
}

export function getConnectionsByUser(userId: string) {
  return client.get<{ connections: Connection[] }>(`/connections/user/${userId}`);
}

export function updateConnectionStatus(id: string, status: "approved" | "declined") {
  return client.patch<{ updated: Connection }>(`/connections/${id}`, { status });
}

export function removeConnection(id: string) {
  return client.delete(`/connections/${id}`);
}
