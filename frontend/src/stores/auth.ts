import { defineStore } from "pinia";
import { ref } from "vue";
import * as authApi from "../api/auth";
import { getMyProfile } from "../api/users";
import type { MyUser } from "../api/users";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<MyUser | null>(null);
  const initialised = ref(false);

  /** Called once on app load, restores session from the httpOnly cookie. */
  async function init() {
    try {
      const res = await getMyProfile();
      user.value = res.data.user;
    } catch {
      user.value = null;
    } finally {
      initialised.value = true;
    }
  }

  async function register(data: { name: string; email: string; password: string }) {
    const res = await authApi.register(data);
    user.value = res.data.user as MyUser;
  }

  async function login(data: { email: string; password: string }) {
    const res = await authApi.login(data);
    user.value = res.data.user as MyUser;
  }

  async function logout() {
    await authApi.logout();
    user.value = null;
  }

  return { user, initialised, init, register, login, logout };
});
