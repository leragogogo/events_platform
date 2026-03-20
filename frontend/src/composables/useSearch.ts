import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { searchAll } from "../api/search";
import type { SearchResult } from "../api/search";

/**
 * Composable for searching users and events across the platform.
 *
 * Debounces input by 300ms and requires at least 2 characters before
 * firing a request.
 */
export function useSearch() {
  const query = ref("");
  const debouncedQuery = ref("");

  let timer: ReturnType<typeof setTimeout>;

  watch(query, (val) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      debouncedQuery.value = val.trim();
    }, 300);
  });

  const isEnabled = computed(() => debouncedQuery.value.length >= 2);

  const { data, isLoading, isError } = useQuery({
    queryKey: computed(() => ["search", debouncedQuery.value]),
    queryFn: () => searchAll(debouncedQuery.value).then((r) => r.data),
    enabled: isEnabled,
    placeholderData: (prev: SearchResult | undefined) => prev,
  });

  const users = computed(() => data.value?.users ?? []);
  const events = computed(() => data.value?.events ?? []);
  const showResults = computed(() => isEnabled.value);

  return { query, users, events, isLoading, isError, showResults };
}
