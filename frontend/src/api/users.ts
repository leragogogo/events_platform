import client from "./client";
import type { Event } from "./events";

export interface PublicUser {
  _id: string;
  name: string;
  createdAt: string;
}

export interface MyUser extends PublicUser {
  email: string;
}

export interface MyProfileResponse {
  user: MyUser;
  createdEvents: Event[];
  participatedEvents: Event[];
}

export interface UserProfileConnected {
  user: PublicUser;
  createdEvents: Event[];
  participatedEvents: Event[];
}

export interface UserProfileDisconnected {
  user: PublicUser;
  createdEventsCount: number;
  participatedEventsCount: number;
}

export type UserProfileResponse = UserProfileConnected | UserProfileDisconnected;

export function getMyProfile() {
  return client.get<MyProfileResponse>("/users/me");
}

export function getUserProfile(id: string) {
  return client.get<UserProfileResponse>(`/users/${id}`);
}

export function updateMyName(name: string) {
  return client.patch<{ user: MyUser }>("/users/me/name", { name });
}

export function updateMyPassword(password: string) {
  return client.patch<{ user: MyUser }>("/users/me/password", { password });
}
