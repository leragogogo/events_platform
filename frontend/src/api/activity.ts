import client from "./client";
import type { Event } from "./events";

export type ActivityType = "created" | "registered";

export interface Activity {
  _id: string;
  actorId: string;
  type: ActivityType;
  eventId: string | Event;
  createdAt: string;
  expiresAt: string;
}

export function logActivity(data: { type: ActivityType; eventId: string }) {
  return client.post<{ activity: Activity }>("/activity", data);
}

export function getActivityFeed() {
  return client.get<{ activities: Activity[] }>("/activity/feed");
}

export function getActivitiesByUser(userId: string) {
  return client.get<{ activities: Activity[] }>(`/activity/user/${userId}`);
}
