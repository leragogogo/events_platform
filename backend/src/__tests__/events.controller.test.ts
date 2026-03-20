/**
 * Unit tests for the events controller.
 *
 * The Event model is mocked, no database connection is required.
 */

import { Request, Response, NextFunction } from "express";
import {
    createEvent,
    getCategories,
    getEventById,
    getEventsByUserId,
    updateEventField,
    deleteEvent,
} from "../controllers/events.controller.js";
import { Event, EVENT_CATEGORIES } from "../models/Event.js";
import { Activity } from "../models/Activity.js";

jest.mock("../models/Activity.js", () => ({
    Activity: { create: jest.fn() },
    ACTIVITY_TTL_DAYS: 7,
}));

const mockActivity = Activity as unknown as { create: jest.Mock };

jest.mock("../models/Event.js", () => ({
    Event: {
        create: jest.fn(),
        findById: jest.fn(),
        find: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
    },
    EVENT_CATEGORIES: ["Music", "Tech", "Art", "Sports", "Food", "Education", "Community", "Other"],
}));

const mockEvent = Event as unknown as {
    create: jest.Mock;
    findById: jest.Mock;
    find: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
};

const OWNER_ID = "user-abc";
const EVENT_ID = "event-xyz";
const FUTURE_DATE = new Date(Date.now() + 86_400_000).toISOString();

const VALID_BODY = {
    title: "My Event",
    description: "A cool event",
    category: "Tech",
    dateTime: FUTURE_DATE,
    address: "123 Main St",
    city: "London",
    coordinates: [-0.1278, 51.5074],
    capacity: 100,
};

/** Stored event doc returned by Mongoose queries. */
const STORED_EVENT = {
    _id: EVENT_ID,
    ...VALID_BODY,
    createdByUserId: { toString: () => OWNER_ID },
};

function makeReq(
    body: Record<string, unknown> = {},
    params: Record<string, string> = {},
    userId?: string,
): Request {
    const req: Record<string, unknown> = { body, params };
    if (userId !== undefined) req.user = { userId };
    return req as unknown as Request;
}

function makeRes(): Response {
    const res = {} as Response;
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res;
}

function makeNext(): NextFunction {
    return jest.fn() as unknown as NextFunction;
}

/** Extracts the errors map from the first res.json call. */
function getErrors(res: Response): Record<string, string> {
    return (res.json as jest.Mock).mock.calls[0][0].errors;
}

describe("createEvent", () => {
    beforeEach(() => {
        mockEvent.create.mockResolvedValue(STORED_EVENT);
        mockActivity.create.mockResolvedValue({});
    });

    it("returns 201 with the created event on valid input", async () => {
        const res = makeRes();
        await createEvent(makeReq(VALID_BODY, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ event: STORED_EVENT });
    });

    it("returns 400 with errors.title when title is missing", async () => {
        const { title: _t, ...body } = VALID_BODY;
        const res = makeRes();
        await createEvent(makeReq(body, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("title");
    });

    it("returns 400 with errors.title when title is blank whitespace", async () => {
        const res = makeRes();
        await createEvent(makeReq({ ...VALID_BODY, title: "   " }, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("title");
    });

    it("returns 400 with errors.description when description is missing", async () => {
        const { description: _d, ...body } = VALID_BODY;
        const res = makeRes();
        await createEvent(makeReq(body, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("description");
    });

    it("returns 400 with errors.category when category is missing", async () => {
        const { category: _c, ...body } = VALID_BODY;
        const res = makeRes();
        await createEvent(makeReq(body, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("category");
    });

    it("returns 400 with errors.category when category is not in the allowed list", async () => {
        const res = makeRes();
        await createEvent(makeReq({ ...VALID_BODY, category: "Yoga" }, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("category");
    });

    it("returns 400 with errors.dateTime when dateTime is missing", async () => {
        const { dateTime: _dt, ...body } = VALID_BODY;
        const res = makeRes();
        await createEvent(makeReq(body, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("dateTime");
    });

    it("returns 400 with errors.dateTime when dateTime is not a valid date string", async () => {
        const res = makeRes();
        await createEvent(makeReq({ ...VALID_BODY, dateTime: "not-a-date" }, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("dateTime");
    });

    it("returns 400 with errors.dateTime when dateTime is in the past", async () => {
        const past = new Date(Date.now() - 86_400_000).toISOString();
        const res = makeRes();
        await createEvent(makeReq({ ...VALID_BODY, dateTime: past }, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("dateTime");
    });

    it("returns 400 with errors.address when address is missing", async () => {
        const { address: _a, ...body } = VALID_BODY;
        const res = makeRes();
        await createEvent(makeReq(body, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("address");
    });

    it("returns 400 with errors.city when city is missing", async () => {
        const { city: _c, ...body } = VALID_BODY;
        const res = makeRes();
        await createEvent(makeReq(body, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("city");
    });

    it("returns 400 with errors.coordinates when coordinates is not an array", async () => {
        const res = makeRes();
        await createEvent(makeReq({ ...VALID_BODY, coordinates: "0,0" }, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("coordinates");
    });

    it("returns 400 with errors.coordinates when coordinates is not 2 elements array", async () => {
        const res = makeRes();
        await createEvent(makeReq({ ...VALID_BODY, coordinates: [0] }, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("coordinates");
    });

    it("returns 400 with errors.coordinates when elements are not numbers", async () => {
        const res = makeRes();
        await createEvent(makeReq({ ...VALID_BODY, coordinates: ["0", "0"] }, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("coordinates");
    });

    it("returns 400 with errors.capacity when capacity is missing", async () => {
        const { capacity: _cap, ...body } = VALID_BODY;
        const res = makeRes();
        await createEvent(makeReq(body, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("capacity");
    });

    it("returns 400 with errors.capacity when capacity is less than 1", async () => {
        const res = makeRes();
        await createEvent(makeReq({ ...VALID_BODY, capacity: 0 }, {}, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getErrors(res)).toHaveProperty("capacity");
    });

    it("collects all failing fields into a single 400 response", async () => {
        const res = makeRes();
        await createEvent(makeReq({}, {}, OWNER_ID), res, makeNext());

        const errors = getErrors(res);
        expect(errors).toHaveProperty("title");
        expect(errors).toHaveProperty("description");
        expect(errors).toHaveProperty("category");
        expect(errors).toHaveProperty("dateTime");
        expect(errors).toHaveProperty("address");
        expect(errors).toHaveProperty("city");
        expect(errors).toHaveProperty("coordinates");
        expect(errors).toHaveProperty("capacity");
    });

    it("does not call Event.create when validation fails", async () => {
        await createEvent(makeReq({}, {}, OWNER_ID), makeRes(), makeNext());

        expect(mockEvent.create).not.toHaveBeenCalled();
    });

    it("calls next(err) when Event.create throws", async () => {
        const error = new Error("DB error");
        mockEvent.create.mockRejectedValue(error);
        const next = makeNext();

        await createEvent(makeReq(VALID_BODY, {}, OWNER_ID), makeRes(), next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it("fire-and-forget logs a 'created' activity on success", async () => {
        await createEvent(makeReq(VALID_BODY, {}, OWNER_ID), makeRes(), makeNext());

        expect(mockActivity.create).toHaveBeenCalledWith(
            expect.objectContaining({ actorId: OWNER_ID, type: "created", eventId: STORED_EVENT._id }),
        );
    });

    it("does not log activity when Event.create fails", async () => {
        mockEvent.create.mockRejectedValue(new Error("DB error"));

        await createEvent(makeReq(VALID_BODY, {}, OWNER_ID), makeRes(), makeNext());

        expect(mockActivity.create).not.toHaveBeenCalled();
    });
});

describe("getCategories", () => {
    it("returns 200 with the full EVENT_CATEGORIES array", () => {
        const res = makeRes();
        getCategories(makeReq(), res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ categories: EVENT_CATEGORIES });
    });
});

describe("getEventById", () => {
    it("returns 200 with the event when found", async () => {
        mockEvent.findById.mockResolvedValue(STORED_EVENT);
        const res = makeRes();
        await getEventById(makeReq({}, { id: EVENT_ID }), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ event: STORED_EVENT });
    });

    it("returns 404 when event does not exist", async () => {
        mockEvent.findById.mockResolvedValue(null);
        const res = makeRes();
        await getEventById(makeReq({}, { id: EVENT_ID }), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("calls next(err) when Event.findById throws", async () => {
        const error = new Error("DB error");
        mockEvent.findById.mockRejectedValue(error);
        const next = makeNext();

        await getEventById(makeReq({}, { id: EVENT_ID }), makeRes(), next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe("getEventsByUserId", () => {
    it("returns 200 with the events array when events exist", async () => {
        mockEvent.find.mockResolvedValue([STORED_EVENT]);
        const res = makeRes();
        await getEventsByUserId(makeReq({}, { userId: OWNER_ID }), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ events: [STORED_EVENT] });
    });

    it("returns 200 with an empty array when no events exist", async () => {
        mockEvent.find.mockResolvedValue([]);
        const res = makeRes();
        await getEventsByUserId(makeReq({}, { userId: OWNER_ID }), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ events: [] });
    });

    it("queries by the userId route param", async () => {
        mockEvent.find.mockResolvedValue([]);
        await getEventsByUserId(makeReq({}, { userId: OWNER_ID }), makeRes(), makeNext());

        expect(mockEvent.find).toHaveBeenCalledWith({ createdByUserId: OWNER_ID });
    });

    it("calls next(err) when Event.find throws", async () => {
        const error = new Error("DB error");
        mockEvent.find.mockRejectedValue(error);
        const next = makeNext();

        await getEventsByUserId(makeReq({}, { userId: OWNER_ID }), makeRes(), next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe("updateEventField", () => {
    const UPDATED_EVENT = { ...STORED_EVENT, title: "New Title" };

    beforeEach(() => {
        mockEvent.findById.mockResolvedValue(STORED_EVENT);
        mockEvent.findByIdAndUpdate.mockResolvedValue(UPDATED_EVENT);
    });

    it("returns 200 with updated event", async () => {
        const res = makeRes();
        await updateEventField(
            makeReq({ value: "New Title" }, { id: EVENT_ID, field: "title" }, OWNER_ID),
            res,
            makeNext(),
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ event: UPDATED_EVENT });
    });

    it("returns 400 when field is not in the whitelist", async () => {
        const res = makeRes();
        await updateEventField(
            makeReq({ value: "hax" }, { id: EVENT_ID, field: "createdByUserId" }, OWNER_ID),
            res,
            makeNext(),
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockEvent.findById).not.toHaveBeenCalled();
    });

    it("returns 404 when event is not found", async () => {
        mockEvent.findById.mockResolvedValue(null);
        const res = makeRes();
        await updateEventField(
            makeReq({ value: "x" }, { id: EVENT_ID, field: "title" }, OWNER_ID),
            res,
            makeNext(),
        );

        expect(res.status).toHaveBeenCalledWith(404);
        expect(mockEvent.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("returns 403 when the requester is not the owner", async () => {
        const res = makeRes();
        await updateEventField(
            makeReq({ value: "x" }, { id: EVENT_ID, field: "title" }, "other-user"),
            res,
            makeNext(),
        );

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockEvent.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("calls next(err) when Event.findByIdAndUpdate throws", async () => {
        const error = new Error("DB error");
        mockEvent.findByIdAndUpdate.mockRejectedValue(error);
        const next = makeNext();

        await updateEventField(
            makeReq({ value: "x" }, { id: EVENT_ID, field: "title" }, OWNER_ID),
            makeRes(),
            next,
        );

        expect(next).toHaveBeenCalledWith(error);
    });
});

describe("deleteEvent", () => {
    beforeEach(() => {
        mockEvent.findById.mockResolvedValue(STORED_EVENT);
        mockEvent.findByIdAndDelete.mockResolvedValue(STORED_EVENT);
    });

    it("returns 204 on successful deletion", async () => {
        const res = makeRes();
        await deleteEvent(makeReq({}, { id: EVENT_ID }, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it("returns 404 when event is not found", async () => {
        mockEvent.findById.mockResolvedValue(null);
        const res = makeRes();
        await deleteEvent(makeReq({}, { id: EVENT_ID }, OWNER_ID), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(404);
        expect(mockEvent.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("returns 403 when the requester is not the owner", async () => {
        const res = makeRes();
        await deleteEvent(makeReq({}, { id: EVENT_ID }, "other-user"), res, makeNext());

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockEvent.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("calls next(err) when Event.findByIdAndDelete throws", async () => {
        const error = new Error("DB error");
        mockEvent.findByIdAndDelete.mockRejectedValue(error);
        const next = makeNext();

        await deleteEvent(makeReq({}, { id: EVENT_ID }, OWNER_ID), makeRes(), next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
