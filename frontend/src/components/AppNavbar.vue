<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import UserAvatar from "./ui/UserAvatar.vue";
import BaseButton from "./ui/BaseButton.vue";

const router = useRouter();
const auth = useAuthStore();

const loggingOut = ref(false);

async function logout() {
  loggingOut.value = true;
  try {
    await auth.logout();
    router.push({ name: "feed" });
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__inner">
      <nav class="navbar__nav">
        <RouterLink to="/feed" class="navbar__brand">Eventio</RouterLink>
        <RouterLink to="/feed" class="navbar__link">Feed</RouterLink>
        <RouterLink v-if="auth.user" to="/events" class="navbar__link">Events</RouterLink>
      </nav>

      <div class="navbar__user">
        <template v-if="auth.user">
          <RouterLink :to="{ name: 'profile' }" class="navbar__profile-link">
            <UserAvatar :name="auth.user.name" size="sm" />
            <span class="navbar__username">{{ auth.user.name }}</span>
          </RouterLink>
          <BaseButton variant="ghost" size="sm" :loading="loggingOut" @click="logout">
            Sign out
          </BaseButton>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'login' }" class="navbar__link">Sign in</RouterLink>
          <RouterLink :to="{ name: 'register' }" class="navbar__auth-cta">Create account</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: #fff;
  border-bottom: 1px solid var(--color-neutral-200);
}

.navbar__inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
}

.navbar__nav {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.navbar__brand {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
}

.navbar__link {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-neutral-600);
  text-decoration: none;
  transition: color 0.15s;
}
.navbar__link:hover,
.navbar__link.router-link-active {
  color: var(--color-neutral-900);
}

.navbar__user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.navbar__profile-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  border-radius: var(--radius-md);
  padding: var(--space-1) var(--space-2);
  transition: background-color 0.15s;
}
.navbar__profile-link:hover {
  background-color: var(--color-neutral-100);
}

.navbar__username {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-neutral-700);
}

.navbar__auth-cta {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #fff;
  background-color: var(--color-primary);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  transition: background-color 0.15s;
}
.navbar__auth-cta:hover {
  background-color: var(--color-primary-dark, var(--color-primary));
  opacity: 0.9;
}
</style>
