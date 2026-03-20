import { useEventForm } from "../../composables/useEventForm";
import { geocodeAddress } from "../../api/geocoding";
import type { Event } from "../../api/events";

vi.mock("../../api/geocoding", () => ({ geocodeAddress: vi.fn() }));

const FUTURE = "2099-12-31T23:59";

const mockEvent: Event = {
  _id: "event-1",
  title: "Test Event",
  description: "A description",
  category: "Music",
  dateTime: "2099-06-15T14:30:00.000Z",
  address: "123 Main St",
  city: "London",
  coordinates: [-0.1276, 51.5074],
  capacity: 100,
  createdByUserId: "user-1",
  createdAt: "2024-01-01T00:00:00.000Z",
};

/** Pre-seeds a fully valid form, including geocodedResult, via fill() */
function filled() {
  const form = useEventForm();
  form.fill(mockEvent);
  form.title.value = "Test Event";
  form.description.value = "A description";
  form.category.value = "Music";
  form.dateTime.value = FUTURE;
  form.capacity.value = "100";
  return form;
}

describe("useEventForm", () => {
  describe("validate", () => {
    it("sets title error when empty", () => {
      const form = filled();
      form.title.value = "";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.title).toBe("Title is required");
    });

    it("sets description error when empty", () => {
      const form = filled();
      form.description.value = "   ";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.description).toBe("Description is required");
    });

    it("sets category error when empty", () => {
      const form = filled();
      form.category.value = "";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.category).toBe("Select a category");
    });

    it("sets dateTime error when empty", () => {
      const form = filled();
      form.dateTime.value = "";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.dateTime).toBe("Date and time are required");
    });

    it("sets dateTime error when date is in the past", () => {
      const form = filled();
      form.dateTime.value = "2000-01-01T00:00";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.dateTime).toBe("Date must be in the future");
    });

    it("sets address error when empty", () => {
      const form = filled();
      form.address.value = "";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.address).toBe("Address is required");
    });

    it("sets coordinates error when geocoding has not been done", () => {
      const form = useEventForm();
      form.title.value = "Test Event";
      form.description.value = "A description";
      form.category.value = "Music";
      form.dateTime.value = FUTURE;
      form.address.value = "123 Main St";
      form.capacity.value = "100";
      // geocodedResult is null — no fill, no geocode
      expect(form.validate()).toBe(false);
      expect(form.errors.value.coordinates).toBe("A valid address with geocoding is required");
    });

    it("sets capacity error when empty", () => {
      const form = filled();
      form.capacity.value = "";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.capacity).toBe("Capacity is required");
    });

    it("sets capacity error when value is not a whole number", () => {
      const form = filled();
      form.capacity.value = "10.5";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.capacity).toBe("Capacity must be a whole number ≥ 1");
    });

    it("sets capacity error when value is less than 1", () => {
      const form = filled();
      form.capacity.value = "0";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.capacity).toBe("Capacity must be a whole number ≥ 1");
    });

    it("returns true and sets no errors for valid input", () => {
      const form = filled();
      expect(form.validate()).toBe(true);
      expect(form.errors.value).toEqual({});
    });
  });

  describe("toPayload", () => {
    it("trims title, description and address", () => {
      const form = filled();
      form.title.value = "  Test Event  ";
      form.description.value = "  A description  ";
      form.address.value = "  123 Main St  ";
      const payload = form.toPayload();
      expect(payload.title).toBe("Test Event");
      expect(payload.description).toBe("A description");
      expect(payload.address).toBe("123 Main St");
    });

    it("converts dateTime to ISO string", () => {
      const form = filled();
      const payload = form.toPayload();
      expect(payload.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("uses geocoded city", () => {
      const form = filled();
      const payload = form.toPayload();
      expect(payload.city).toBe("London");
    });

    it("uses geocoded coordinates", () => {
      const form = filled();
      const payload = form.toPayload();
      expect(payload.coordinates).toEqual([-0.1276, 51.5074]);
    });

    it("parses capacity as a number", () => {
      const form = filled();
      const payload = form.toPayload();
      expect(payload.capacity).toBe(100);
      expect(typeof payload.capacity).toBe("number");
    });
  });

  describe("fill", () => {
    it("populates all fields from an event object", () => {
      const form = useEventForm();
      form.fill(mockEvent);
      expect(form.title.value).toBe(mockEvent.title);
      expect(form.description.value).toBe(mockEvent.description);
      expect(form.category.value).toBe(mockEvent.category);
      expect(form.address.value).toBe(mockEvent.address);
    });

    it("pre-populates geocodedResult from event coordinates and city", () => {
      const form = useEventForm();
      form.fill(mockEvent);
      expect(form.geocodedResult.value).toEqual({
        coordinates: mockEvent.coordinates,
        city: mockEvent.city,
      });
    });

    it("marks address as already geocoded so blur is a no-op", async () => {
      const form = useEventForm();
      form.fill(mockEvent);
      // address matches lastGeocodedAddress — handleAddressBlur should short-circuit
      await form.handleAddressBlur();
      expect(geocodeAddress).not.toHaveBeenCalled();
    });
  });

  describe("handleAddressBlur", () => {
    beforeEach(() => {
      vi.mocked(geocodeAddress).mockResolvedValue({
        coordinates: [-0.1276, 51.5074],
        city: "London",
      });
    });

    it("calls geocodeAddress with the trimmed address", async () => {
      const form = useEventForm();
      form.address.value = "  10 Downing Street, London  ";
      await form.handleAddressBlur();
      expect(geocodeAddress).toHaveBeenCalledWith("10 Downing Street, London");
    });

    it("is a no-op when address is empty", async () => {
      const form = useEventForm();
      form.address.value = "";
      await form.handleAddressBlur();
      expect(geocodeAddress).not.toHaveBeenCalled();
    });

    it("is a no-op when address equals last geocoded address", async () => {
      const form = useEventForm();
      form.fill(mockEvent); // sets lastGeocodedAddress to mockEvent.address
      form.address.value = mockEvent.address;
      await form.handleAddressBlur();
      expect(geocodeAddress).not.toHaveBeenCalled();
    });

    it("sets geocodedResult on success", async () => {
      const form = useEventForm();
      form.address.value = "10 Downing Street, London";
      await form.handleAddressBlur();
      expect(form.geocodedResult.value).toEqual({
        coordinates: [-0.1276, 51.5074],
        city: "London",
      });
    });

    it("sets geocodeError when result is null (address not found)", async () => {
      vi.mocked(geocodeAddress).mockResolvedValue(null);
      const form = useEventForm();
      form.address.value = "zzz not a real place zzz";
      await form.handleAddressBlur();
      expect(form.geocodeError.value).toBe("Address not found. Try a more specific address.");
      expect(form.geocodedResult.value).toBeNull();
    });

    it("sets geocodeError on network failure", async () => {
      vi.mocked(geocodeAddress).mockRejectedValue(new Error("Network error"));
      const form = useEventForm();
      form.address.value = "10 Downing Street, London";
      await form.handleAddressBlur();
      expect(form.geocodeError.value).toBe("Geocoding failed. Check your connection and try again.");
    });

    it("resets isGeocoding to false after success", async () => {
      const form = useEventForm();
      form.address.value = "10 Downing Street, London";
      await form.handleAddressBlur();
      expect(form.isGeocoding.value).toBe(false);
    });

    it("resets isGeocoding to false after failure", async () => {
      vi.mocked(geocodeAddress).mockRejectedValue(new Error("fail"));
      const form = useEventForm();
      form.address.value = "10 Downing Street, London";
      await form.handleAddressBlur();
      expect(form.isGeocoding.value).toBe(false);
    });

    it("clears previous geocodedResult before re-geocoding a new address", async () => {
      const form = useEventForm();
      form.fill(mockEvent); // seeds geocodedResult with London
      form.address.value = "A completely different address";
      // Make geocodeAddress resolve null so we can inspect the cleared state via error
      vi.mocked(geocodeAddress).mockResolvedValue(null);
      await form.handleAddressBlur();
      expect(form.geocodedResult.value).toBeNull();
    });
  });
});
