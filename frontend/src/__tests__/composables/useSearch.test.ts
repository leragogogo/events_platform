import { nextTick, ref } from "vue";
import { useSearch } from "../../composables/useSearch";
import { useQuery } from "@tanstack/vue-query";

jest.mock("@tanstack/vue-query", () => ({ useQuery: jest.fn() }));
jest.mock("../../api/search", () => ({ searchAll: jest.fn() }));

const USERS = [{ _id: "u1", name: "Alice", createdAt: "2024-01-01T00:00:00.000Z" }];
const EVENTS = [{ _id: "e1", title: "Tech Meetup", description: "", category: "Tech",
  dateTime: "", address: "", city: "", coordinates: [0, 0] as [number, number],
  capacity: 50, createdByUserId: "u1", createdAt: "" }];

function setup(overrides: { data?: unknown; isLoading?: boolean; isError?: boolean } = {}) {
  jest.mocked(useQuery).mockReturnValue({
    data: ref(overrides.data),
    isLoading: ref(overrides.isLoading ?? false),
    isError: ref(overrides.isError ?? false),
  } as any);
  return useSearch();
}

describe("useSearch", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("showResults", () => {
    it("is false initially when query is empty", () => {
      const { showResults } = setup();
      expect(showResults.value).toBe(false);
    });
  });

  describe("users and events", () => {
    it("returns users array from query data", () => {
      const { users } = setup({ data: { users: USERS, events: [] } });
      expect(users.value).toEqual(USERS);
    });

    it("returns events array from query data", () => {
      const { events } = setup({ data: { users: [], events: EVENTS } });
      expect(events.value).toEqual(EVENTS);
    });

    it("returns empty users array when data is undefined", () => {
      const { users } = setup({ data: undefined });
      expect(users.value).toEqual([]);
    });

    it("returns empty events array when data is undefined", () => {
      const { events } = setup({ data: undefined });
      expect(events.value).toEqual([]);
    });
  });

  describe("isLoading and isError forwarding", () => {
    it("forwards isLoading true from useQuery", () => {
      const { isLoading } = setup({ isLoading: true });
      expect(isLoading.value).toBe(true);
    });

    it("forwards isLoading false from useQuery", () => {
      const { isLoading } = setup({ isLoading: false });
      expect(isLoading.value).toBe(false);
    });

    it("forwards isError true from useQuery", () => {
      const { isError } = setup({ isError: true });
      expect(isError.value).toBe(true);
    });

    it("forwards isError false from useQuery", () => {
      const { isError } = setup({ isError: false });
      expect(isError.value).toBe(false);
    });
  });

  describe("debounce behavior", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("showResults becomes true after debounce fires with query >= 2 chars", async () => {
      jest.mocked(useQuery).mockReturnValue({
        data: ref(undefined),
        isLoading: ref(false),
        isError: ref(false),
      } as any);

      const { query, showResults } = useSearch();
      expect(showResults.value).toBe(false);

      query.value = "ab";
      await nextTick();
      jest.runAllTimers();

      expect(showResults.value).toBe(true);
    });

    it("showResults remains false when query length is 1 after debounce fires", async () => {
      jest.mocked(useQuery).mockReturnValue({
        data: ref(undefined),
        isLoading: ref(false),
        isError: ref(false),
      } as any);

      const { query, showResults } = useSearch();
      query.value = "a";
      await nextTick();
      jest.runAllTimers();

      expect(showResults.value).toBe(false);
    });

    it("showResults returns to false when query is cleared after debounce", async () => {
      jest.mocked(useQuery).mockReturnValue({
        data: ref(undefined),
        isLoading: ref(false),
        isError: ref(false),
      } as any);

      const { query, showResults } = useSearch();

      query.value = "ab";
      await nextTick();
      jest.runAllTimers();
      expect(showResults.value).toBe(true);

      query.value = "";
      await nextTick();
      jest.runAllTimers();
      expect(showResults.value).toBe(false);
    });
  });
});
