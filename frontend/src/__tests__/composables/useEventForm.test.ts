import { useEventForm } from "../../composables/useEventForm";
import type { Event } from "../../api/events";

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

function filled() {
  const form = useEventForm();
  form.title.value = "Test Event";
  form.description.value = "A description";
  form.category.value = "Music";
  form.dateTime.value = FUTURE;
  form.address.value = "123 Main St";
  form.city.value = "London";
  form.longitude.value = "-0.1276";
  form.latitude.value = "51.5074";
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

    it("sets city error when empty", () => {
      const form = filled();
      form.city.value = "";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.city).toBe("City is required");
    });

    it("sets coordinates error when longitude is missing", () => {
      const form = filled();
      form.longitude.value = "";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.coordinates).toBe("Longitude and latitude are required");
    });

    it("sets coordinates error when latitude is missing", () => {
      const form = filled();
      form.latitude.value = "";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.coordinates).toBe("Longitude and latitude are required");
    });

    it("sets coordinates error when values are not valid numbers", () => {
      const form = filled();
      form.longitude.value = "abc";
      expect(form.validate()).toBe(false);
      expect(form.errors.value.coordinates).toBe("Enter valid numbers");
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
    it("trims title, description, address and city", () => {
      const form = filled();
      form.title.value = "  Test Event  ";
      form.description.value = "  A description  ";
      form.address.value = "  123 Main St  ";
      form.city.value = "  London  ";
      const payload = form.toPayload();
      expect(payload.title).toBe("Test Event");
      expect(payload.description).toBe("A description");
      expect(payload.address).toBe("123 Main St");
      expect(payload.city).toBe("London");
    });

    it("converts dateTime to ISO string", () => {
      const form = filled();
      const payload = form.toPayload();
      expect(payload.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("parses coordinates as floats", () => {
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
      expect(form.city.value).toBe(mockEvent.city);
    });
  });
});
