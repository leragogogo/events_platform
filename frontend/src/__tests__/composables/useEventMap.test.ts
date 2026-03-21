import { ref } from "vue";
import { useEventMap } from "../../composables/useEventMap";
import { useQuery } from "@tanstack/vue-query";
import type { MapEvent } from "../../api/events";

jest.mock("@tanstack/vue-query", () => ({ useQuery: jest.fn() }));
jest.mock("../../api/events", () => ({ getAllEvents: jest.fn() }));

const MAP_EVENTS: MapEvent[] = [
  {
    _id: "e1",
    title: "Tech Meetup",
    dateTime: "2025-06-01T18:00:00.000Z",
    city: "London",
    category: "Tech",
    coordinates: [-0.1278, 51.5074],
  },
];

function setup(overrides: { data?: unknown; isLoading?: boolean; isError?: boolean } = {}) {
  jest.mocked(useQuery).mockReturnValue({
    data: ref(overrides.data),
    isLoading: ref(overrides.isLoading ?? false),
    isError: ref(overrides.isError ?? false),
  } as any);

  const category = ref("");
  const dateFrom = ref("");
  const dateTo = ref("");
  const result = useEventMap({ category, dateFrom, dateTo });
  return { ...result, category, dateFrom, dateTo };
}

describe("useEventMap", () => {
  afterEach(() => jest.clearAllMocks());

  describe("events", () => {
    it("returns the events array from query data", () => {
      const { events } = setup({ data: MAP_EVENTS });
      expect(events.value).toEqual(MAP_EVENTS);
    });

    it("returns an empty array when data is undefined", () => {
      const { events } = setup({ data: undefined });
      expect(events.value).toEqual([]);
    });

    it("returns an empty array when data is an empty array", () => {
      const { events } = setup({ data: [] });
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

  describe("queryFn filter coercion", () => {
    it("omits empty-string filter values (passes undefined for empty fields)", async () => {
      const { getAllEvents } = await import("../../api/events");
      jest.mocked(getAllEvents).mockResolvedValue({ data: { events: [] } } as any);

      jest.mocked(useQuery).mockImplementation(({ queryFn }: any) => {
        queryFn();
        return { data: ref(undefined), isLoading: ref(false), isError: ref(false) } as any;
      });

      const category = ref("");
      const dateFrom = ref("");
      const dateTo = ref("");
      useEventMap({ category, dateFrom, dateTo });

      expect(getAllEvents).toHaveBeenCalledWith({
        category: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
    });

    it("passes non-empty filter values through to getAllEvents", async () => {
      const { getAllEvents } = await import("../../api/events");
      jest.mocked(getAllEvents).mockResolvedValue({ data: { events: [] } } as any);

      jest.mocked(useQuery).mockImplementation(({ queryFn }: any) => {
        queryFn();
        return { data: ref(undefined), isLoading: ref(false), isError: ref(false) } as any;
      });

      const category = ref("Tech");
      const dateFrom = ref("2025-01-01");
      const dateTo = ref("2025-12-31");
      useEventMap({ category, dateFrom, dateTo });

      expect(getAllEvents).toHaveBeenCalledWith({
        category: "Tech",
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      });
    });
  });
});
