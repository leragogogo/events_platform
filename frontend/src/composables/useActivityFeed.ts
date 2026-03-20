import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { getActivityFeed } from "../api/activity";
import type { Activity } from "../api/activity";

/**
 * Composable for fetching the authenticated user's activity feed.
 *
 * Returns recent activity from approved connections — events they created
 * or registered for.
 */
export function useActivityFeed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: () => getActivityFeed().then((r) => r.data.activities),
  });

  const activities = computed<Activity[]>(() => data.value ?? []);

  return { activities, isLoading, isError };
}
