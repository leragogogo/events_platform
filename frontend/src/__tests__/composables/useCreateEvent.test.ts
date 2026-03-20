import { useCreateEvent } from "../../composables/useCreateEvent";
import { useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { createEvent } from "../../api/events";
import { geocodeAddress } from "../../api/geocoding";

vi.mock("vue-router", () => ({ useRouter: vi.fn() }));
vi.mock("@tanstack/vue-query", () => ({ useQueryClient: vi.fn() }));
vi.mock("../../api/events", () => ({ createEvent: vi.fn() }));
vi.mock("../../api/geocoding", () => ({ geocodeAddress: vi.fn() }));

const FUTURE = "2099-12-31T23:59";

const mockCreatedEvent = {
  _id: "new-event-id",
  title: "Test Event",
  description: "A description",
  category: "Music",
  dateTime: "2099-12-31T23:59:00.000Z",
  address: "123 Main St",
  city: "London",
  coordinates: [-0.1276, 51.5074] as [number, number],
  capacity: 100,
  createdByUserId: "user-1",
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("useCreateEvent", () => {
  let push: ReturnType<typeof vi.fn>;
  let invalidateQueries: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    push = vi.fn();
    invalidateQueries = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as any);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries } as any);
    vi.mocked(createEvent).mockResolvedValue({ data: { event: mockCreatedEvent } } as any);
    vi.mocked(geocodeAddress).mockResolvedValue({ coordinates: [-0.1276, 51.5074], city: "London" });
  });

  function setup() {
    const form = useCreateEvent();
    form.title.value = "Test Event";
    form.description.value = "A description";
    form.category.value = "Music";
    form.dateTime.value = FUTURE;
    form.address.value = "123 Main St";
    form.capacity.value = "100";
    form.geocodedResult.value = { coordinates: [-0.1276, 51.5074], city: "London" };
    return form;
  }

  describe("submit", () => {
    it("does not call createEvent when form is invalid", async () => {
      const { submit } = useCreateEvent();
      await submit();
      expect(createEvent).not.toHaveBeenCalled();
    });

    it("calls createEvent with the form payload", async () => {
      const { submit } = setup();
      await submit();
      expect(createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Event",
          description: "A description",
          category: "Music",
          address: "123 Main St",
          city: "London",
          coordinates: [-0.1276, 51.5074],
          capacity: 100,
        })
      );
    });

    it("invalidates events query on success", async () => {
      const { submit } = setup();
      await submit();
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["events"] });
    });

    it("navigates to event-detail with the new event id on success", async () => {
      const { submit } = setup();
      await submit();
      expect(push).toHaveBeenCalledWith({
        name: "event-detail",
        params: { id: "new-event-id" },
      });
    });

    it("sets serverError from API response on failure", async () => {
      vi.mocked(createEvent).mockRejectedValue({
        response: { data: { message: "Server error" } },
      });
      const { serverError, submit } = setup();
      await submit();
      expect(serverError.value).toBe("Server error");
      expect(push).not.toHaveBeenCalled();
    });

    it("falls back to generic message when response has no body", async () => {
      vi.mocked(createEvent).mockRejectedValue(new Error("Network error"));
      const { serverError, submit } = setup();
      await submit();
      expect(serverError.value).toBe("Failed to create event. Please try again.");
    });

    it("resets isPending to false after success", async () => {
      const { isPending, submit } = setup();
      await submit();
      expect(isPending.value).toBe(false);
    });

    it("resets isPending to false after failure", async () => {
      vi.mocked(createEvent).mockRejectedValue(new Error("fail"));
      const { isPending, submit } = setup();
      await submit();
      expect(isPending.value).toBe(false);
    });

    it("geocodes address on submit if address was not blurred", async () => {
      vi.mocked(geocodeAddress).mockResolvedValue({ coordinates: [-0.1276, 51.5074], city: "London" });
      const form = useCreateEvent();
      form.title.value = "Test Event";
      form.description.value = "A description";
      form.category.value = "Music";
      form.dateTime.value = FUTURE;
      form.address.value = "10 Downing Street, London";
      form.capacity.value = "100";
      // geocodedResult is null and address does not match lastGeocodedAddress → needsGeocode is true
      await form.submit();
      expect(geocodeAddress).toHaveBeenCalledWith("10 Downing Street, London");
    });
  });
});
