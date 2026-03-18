import client from "./client";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
}

export function register(data: { name: string; email: string; password: string }) {
  return client.post<{ user: AuthUser }>("/auth/register", data);
}

export function login(data: { email: string; password: string }) {
  return client.post<{ user: AuthUser }>("/auth/login", data);
}

export function logout() {
  return client.post("/auth/logout");
}
