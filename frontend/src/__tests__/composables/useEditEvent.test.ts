import { useEditEvent } from "../../composables/useEditEvent";
import { useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { updateEvent } from "../../api/events";

vi.mock("vue-router", () => ({ useRouter: vi.fn() }));
vi.mock("@tanstack/vue-query", () => ({ useQueryClient: vi.fn() }));
vi.mock("../../api/events", () => ({ updateEvent: vi.fn() }));

const EVENT_ID = "event-123";
const FUTURE = "2099-12-31T23:59";

describe("useEditEvent", () => {
  let push: ReturnType<typeof vi.fn>;
  let invalidateQueries: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    push = vi.fn();
    invalidateQueries = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as any);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries } as any);
    vi.mocked(updateEvent).mockResolvedValue({ data: { event: {} } } as any);
  });

  function setup() {
    const form = useEditEvent(EVENT_ID);
    form.title.value = "Updated Event";
    form.description.value = "Updated description";
    form.category.value = "Sports";
    form.dateTime.value = FUTURE;
    form.address.value = "456 Other St";
    form.city.value = "Manchester";
    form.longitude.value = "-2.2426";
    form.latitude.value = "53.4808";
    form.capacity.value = "50";
    return form;
  }

  describe("submit", () => {
    it("does not call updateEvent when form is invalid", async () => {
      const { submit } = useEditEvent(EVENT_ID);
      await submit();
      expect(updateEvent).not.toHaveBeenCalled();
    });

    it("calls updateEvent with the event id and form payload", async () => {
      const { submit } = setup();
      await submit();
      expect(updateEvent).toHaveBeenCalledWith(
        EVENT_ID,
        expect.objectContaining({
          title: "Updated Event",
          description: "Updated description",
          category: "Sports",
          address: "456 Other St",
          city: "Manchester",
          coordinates: [-2.2426, 53.4808],
          capacity: 50,
        })
      );
    });

    it("navigates to event-detail on success", async () => {
      const { submit } = setup();
      await submit();
      expect(push).toHaveBeenCalledWith({
        name: "event-detail",
        params: { id: EVENT_ID },
      });
    });

    it("sets serverError from API response on failure", async () => {
      vi.mocked(updateEvent).mockRejectedValue({
        response: { data: { message: "Not authorised" } },
      });
      const { serverError, submit } = setup();
      await submit();
      expect(serverError.value).toBe("Not authorised");
      expect(push).not.toHaveBeenCalled();
    });

    it("falls back to generic message when response has no body", async () => {
      vi.mocked(updateEvent).mockRejectedValue(new Error("Network error"));
      const { serverError, submit } = setup();
      await submit();
      expect(serverError.value).toBe("Failed to update event. Please try again.");
    });

    it("resets isPending to false after success", async () => {
      const { isPending, submit } = setup();
      await submit();
      expect(isPending.value).toBe(false);
    });

    it("resets isPending to false after failure", async () => {
      vi.mocked(updateEvent).mockRejectedValue(new Error("fail"));
      const { isPending, submit } = setup();
      await submit();
      expect(isPending.value).toBe(false);
    });
  });
});
