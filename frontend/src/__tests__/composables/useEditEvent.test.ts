import { useEditEvent } from "../../composables/useEditEvent";
import { useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { updateEvent } from "../../api/events";
import { geocodeAddress } from "../../api/geocoding";

jest.mock("vue-router", () => ({ useRouter: jest.fn() }));
jest.mock("@tanstack/vue-query", () => ({ useQueryClient: jest.fn() }));
jest.mock("../../api/events", () => ({ updateEvent: jest.fn() }));
jest.mock("../../api/geocoding", () => ({ geocodeAddress: jest.fn() }));

const EVENT_ID = "event-123";
const FUTURE = "2099-12-31T23:59";

describe("useEditEvent", () => {
  let push: ReturnType<typeof jest.fn>;
  let invalidateQueries: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    push = jest.fn();
    invalidateQueries = jest.fn();
    jest.mocked(useRouter).mockReturnValue({ push } as any);
    jest.mocked(useQueryClient).mockReturnValue({ invalidateQueries } as any);
    jest.mocked(updateEvent).mockResolvedValue({ data: { event: {} } } as any);
    jest.mocked(geocodeAddress).mockResolvedValue({ coordinates: [-2.2426, 53.4808], city: "Manchester" });
  });

  function setup() {
    const form = useEditEvent(EVENT_ID);
    form.title.value = "Updated Event";
    form.description.value = "Updated description";
    form.category.value = "Sports";
    form.dateTime.value = FUTURE;
    form.address.value = "456 Other St";
    form.capacity.value = "50";
    form.geocodedResult.value = { coordinates: [-2.2426, 53.4808], city: "Manchester" };
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
      jest.mocked(updateEvent).mockRejectedValue({
        response: { data: { message: "Not authorised" } },
      });
      const { serverError, submit } = setup();
      await submit();
      expect(serverError.value).toBe("Not authorised");
      expect(push).not.toHaveBeenCalled();
    });

    it("falls back to generic message when response has no body", async () => {
      jest.mocked(updateEvent).mockRejectedValue(new Error("Network error"));
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
      jest.mocked(updateEvent).mockRejectedValue(new Error("fail"));
      const { isPending, submit } = setup();
      await submit();
      expect(isPending.value).toBe(false);
    });

    it("geocodes address on submit if address was not blurred", async () => {
      jest.mocked(geocodeAddress).mockResolvedValue({ coordinates: [-2.2426, 53.4808], city: "Manchester" });
      const form = useEditEvent(EVENT_ID);
      form.title.value = "Updated Event";
      form.description.value = "Updated description";
      form.category.value = "Sports";
      form.dateTime.value = FUTURE;
      form.address.value = "456 Other St, Manchester";
      form.capacity.value = "50";
      // geocodedResult is null and address does not match lastGeocodedAddress → needsGeocode is true
      await form.submit();
      expect(geocodeAddress).toHaveBeenCalledWith("456 Other St, Manchester");
    });
  });
});
