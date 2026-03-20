import client from "./client";
import type { PublicUser } from "./users";
import type { Event } from "./events";

export interface SearchResult {
  users: PublicUser[];
  events: Event[];
}

export function searchAll(q: string) {
  return client.get<SearchResult>("/search", { params: { q } });
}
