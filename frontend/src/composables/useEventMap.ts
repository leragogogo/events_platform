import { computed } from "vue";
import type { Ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { getAllEvents } from "../api/events";
import type { MapEvent } from "../api/events";

/**
 * Composable for fetching all events to display on the map.
 *
 * Re-fetches automatically whenever any filter ref changes.
 */
export function useEventMap(filters: {
  category: Ref<string>;
  dateFrom: Ref<string>;
  dateTo: Ref<string>;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: computed(() => [
      "events-map",
      filters.category.value,
      filters.dateFrom.value,
      filters.dateTo.value,
    ]),
    queryFn: () =>
      getAllEvents({
        category: filters.category.value || undefined,
        dateFrom: filters.dateFrom.value || undefined,
        dateTo: filters.dateTo.value || undefined,
      }).then((r) => r.data.events),
  });

  const events = computed<MapEvent[]>(() => data.value ?? []);

  return { events, isLoading, isError };
}
