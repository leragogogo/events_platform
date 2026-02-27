/**
 * Unit tests for the registrations controller.
 *
 * Both the Registration and Event models are mocked, no database connection required.
 */

import { Request, Response, NextFunction } from "express";
import { createRegistration, cancelRegistration } from "../controllers/registrations.controller.js";
import { Registration } from "../models/Registration.js";
import { Event } from "../models/Event.js";

jest.mock("../models/Registration.js", () => ({
  Registration: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.mock("../models/Event.js", () => ({
  Event: {
    findById: jest.fn(),
  },
}));

const mockRegistration = Registration as unknown as {
  create: jest.Mock;
  findById: jest.Mock;
  findOne: jest.Mock;
  countDocuments: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

const mockEvent = Event as unknown as {
  findById: jest.Mock;
};

const USER_ID = "user-abc";
const EVENT_ID = "event-xyz";
const REG_ID = "reg-123";

const STORED_EVENT = {
  _id: EVENT_ID,
  title: "Test Event",
  capacity: 10,
};

const STORED_REG = {
  _id: REG_ID,
  userId: { toString: () => USER_ID },
  eventId: EVENT_ID,
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

describe("createRegistration", () => {
  beforeEach(() => {
    mockEvent.findById.mockResolvedValue(STORED_EVENT);
    mockRegistration.findOne.mockResolvedValue(null);
    mockRegistration.countDocuments.mockResolvedValue(0);
    mockRegistration.create.mockResolvedValue(STORED_REG);
  });

  it("returns 201 with the registration on success", async () => {
    const res = makeRes();
    await createRegistration(makeReq({ eventId: EVENT_ID }, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ registration: STORED_REG });
  });

  it("returns 400 when eventId is missing", async () => {
    const res = makeRes();
    await createRegistration(makeReq({}, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockEvent.findById).not.toHaveBeenCalled();
  });

  it("returns 404 when event does not exist", async () => {
    mockEvent.findById.mockResolvedValue(null);
    const res = makeRes();
    await createRegistration(makeReq({ eventId: EVENT_ID }, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockRegistration.create).not.toHaveBeenCalled();
  });

  it("returns 409 when user is already registered for the event", async () => {
    mockRegistration.findOne.mockResolvedValue(STORED_REG);
    const res = makeRes();
    await createRegistration(makeReq({ eventId: EVENT_ID }, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockRegistration.create).not.toHaveBeenCalled();
  });

  it("checks for duplicate using both eventId and userId", async () => {
    mockRegistration.findOne.mockResolvedValue(null);
    await createRegistration(makeReq({ eventId: EVENT_ID }, {}, USER_ID), makeRes(), makeNext());

    expect(mockRegistration.findOne).toHaveBeenCalledWith({ eventId: EVENT_ID, userId: USER_ID });
  });

  it("returns 409 when the event is at full capacity", async () => {
    mockRegistration.countDocuments.mockResolvedValue(10); // equals capacity of 10
    const res = makeRes();
    await createRegistration(makeReq({ eventId: EVENT_ID }, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockRegistration.create).not.toHaveBeenCalled();
  });

  it("allows registration when count is one below capacity", async () => {
    mockRegistration.countDocuments.mockResolvedValue(9); // one below capacity of 10
    const res = makeRes();
    await createRegistration(makeReq({ eventId: EVENT_ID }, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("counts registrations by eventId for the capacity check", async () => {
    await createRegistration(makeReq({ eventId: EVENT_ID }, {}, USER_ID), makeRes(), makeNext());

    expect(mockRegistration.countDocuments).toHaveBeenCalledWith({ eventId: EVENT_ID });
  });

  it("calls next(err) when Event.findById throws", async () => {
    const error = new Error("DB error");
    mockEvent.findById.mockRejectedValue(error);
    const next = makeNext();

    await createRegistration(makeReq({ eventId: EVENT_ID }, {}, USER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("calls next(err) when Registration.create throws", async () => {
    const error = new Error("DB error");
    mockRegistration.create.mockRejectedValue(error);
    const next = makeNext();

    await createRegistration(makeReq({ eventId: EVENT_ID }, {}, USER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("cancelRegistration", () => {
  beforeEach(() => {
    mockRegistration.findById.mockResolvedValue(STORED_REG);
    mockRegistration.findByIdAndDelete.mockResolvedValue(STORED_REG);
  });

  it("returns 204 on successful cancellation", async () => {
    const res = makeRes();
    await cancelRegistration(makeReq({}, { id: REG_ID }, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("returns 404 when registration does not exist", async () => {
    mockRegistration.findById.mockResolvedValue(null);
    const res = makeRes();
    await cancelRegistration(makeReq({}, { id: REG_ID }, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockRegistration.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("returns 403 when the requester does not own the registration", async () => {
    const res = makeRes();
    await cancelRegistration(makeReq({}, { id: REG_ID }, "other-user"), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockRegistration.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("calls next(err) when Registration.findById throws", async () => {
    const error = new Error("DB error");
    mockRegistration.findById.mockRejectedValue(error);
    const next = makeNext();

    await cancelRegistration(makeReq({}, { id: REG_ID }, USER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("calls next(err) when Registration.findByIdAndDelete throws", async () => {
    const error = new Error("DB error");
    mockRegistration.findByIdAndDelete.mockRejectedValue(error);
    const next = makeNext();

    await cancelRegistration(makeReq({}, { id: REG_ID }, USER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
