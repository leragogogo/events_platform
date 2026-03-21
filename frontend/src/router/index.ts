import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public routes
    {
      path: "/login",
      name: "login",
      component: () => import("../pages/LoginPage.vue"),
      meta: { public: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../pages/RegisterPage.vue"),
      meta: { public: true },
    },

    // Protected routes
    {
      path: "/",
      component: () => import("../pages/AppLayout.vue"),
      children: [
        {
          path: "",
          redirect: "/feed",
        },
        {
          path: "feed",
          name: "feed",
          component: () => import("../pages/FeedPage.vue"),
          meta: { public: true },
        },
        {
          path: "events",
          name: "events",
          component: () => import("../pages/EventsPage.vue"),
        },
        {
          path: "events/create",
          name: "events-create",
          component: () => import("../pages/CreateEventPage.vue"),
        },
        {
          path: "events/:id",
          name: "event-detail",
          component: () => import("../pages/EventDetailPage.vue"),
        },
        {
          path: "events/:id/edit",
          name: "event-edit",
          component: () => import("../pages/EditEventPage.vue"),
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("../pages/MyProfilePage.vue"),
        },
        {
          path: "profile/edit",
          name: "profile-edit",
          component: () => import("../pages/EditProfilePage.vue"),
        },
        {
          path: "users/:id",
          name: "user-profile",
          component: () => import("../pages/UserProfilePage.vue"),
        },
      ],
    },

    // Catch-all
    { path: "/:pathMatch(.*)*", redirect: "/feed" },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Wait for the initial session check before any navigation
  if (!auth.initialised) {
    await auth.init();
  }

  const isLoggedIn = !!auth.user;

  // Redirect logged-in users away from login/register
  if ((to.name === "login" || to.name === "register") && isLoggedIn) {
    return { name: "feed" };
  }

  // Redirect unauthenticated users to login
  if (!to.meta.public && !isLoggedIn) {
    return { name: "login" };
  }
});

export default router;
