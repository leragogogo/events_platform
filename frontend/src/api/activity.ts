import client from "./client";

export type ActivityType = "created" | "registered";

export interface ActivityActor {
  _id: string;
  name: string;
}

export interface ActivityEvent {
  _id: string;
  title: string;
  dateTime: string;
  city: string;
  category: string;
}

export interface Activity {
  _id: string;
  actorId: ActivityActor;
  type: ActivityType;
  eventId: ActivityEvent;
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
