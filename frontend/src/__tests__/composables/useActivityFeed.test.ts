import { ref } from "vue";
import { useActivityFeed } from "../../composables/useActivityFeed";
import { useQuery } from "@tanstack/vue-query";
import type { Activity } from "../../api/activity";

vi.mock("@tanstack/vue-query", () => ({ useQuery: vi.fn() }));
vi.mock("../../api/activity", () => ({ getActivityFeed: vi.fn() }));

const ACTIVITIES: Activity[] = [
  {
    _id: "act-1",
    actorId: { _id: "u1", name: "Alice" },
    type: "created",
    eventId: { _id: "e1", title: "Tech Meetup", dateTime: "2025-06-01T18:00:00.000Z", city: "London", category: "Tech" },
    createdAt: "2025-05-01T10:00:00.000Z",
    expiresAt: "2025-05-08T10:00:00.000Z",
  },
];

function setup(overrides: { data?: unknown; isLoading?: boolean; isError?: boolean } = {}) {
  vi.mocked(useQuery).mockReturnValue({
    data: ref(overrides.data),
    isLoading: ref(overrides.isLoading ?? false),
    isError: ref(overrides.isError ?? false),
  } as any);
  return useActivityFeed();
}

describe("useActivityFeed", () => {
  afterEach(() => vi.clearAllMocks());

  describe("activities", () => {
    it("returns the activities array from query data", () => {
      const { activities } = setup({ data: ACTIVITIES });
      expect(activities.value).toEqual(ACTIVITIES);
    });

    it("returns an empty array when data is undefined", () => {
      const { activities } = setup({ data: undefined });
      expect(activities.value).toEqual([]);
    });

    it("returns an empty array when data is an empty array", () => {
      const { activities } = setup({ data: [] });
      expect(activities.value).toEqual([]);
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
});
