/**
 * Unit tests for the activity controller.
 *
 * Activity and Connection models are fully mocked, no database connection required.
 */

import { Request, Response, NextFunction } from "express";
import { logActivity, getActivityFeed, getActivitiesByUserId } from "../controllers/activity.controller.js";
import { Activity, ACTIVITY_TTL_DAYS } from "../models/Activity.js";
import { Connection } from "../models/Connection.js";

jest.mock("../models/Activity.js", () => ({
  Activity: {
    create: jest.fn(),
    find: jest.fn(),
  },
  ACTIVITY_TYPES: ["created", "registered"],
  ACTIVITY_TTL_DAYS: 7,
}));

jest.mock("../models/Connection.js", () => ({
  Connection: {
    find: jest.fn(),
  },
}));

const mockActivity = Activity as unknown as {
  create: jest.Mock;
  find: jest.Mock;
};

const mockConnection = Connection as unknown as {
  find: jest.Mock;
};

const USER_ID = "user-me";
const OTHER_ID = "user-other";
const EVENT_ID = "event-xyz";

const STORED_ACTIVITY = {
  _id: "act-1",
  actorId: OTHER_ID,
  type: "created",
  eventId: EVENT_ID,
  expiresAt: new Date(),
};

/** A connection where USER_ID is the requester and OTHER_ID is the addressee. */
const CONN_AS_REQUESTER = {
  requesterId: { toString: () => USER_ID },
  addresseeId: { toString: () => OTHER_ID },
  status: "approved",
};

/** A connection where USER_ID is the addressee and OTHER_ID is the requester. */
const CONN_AS_ADDRESSEE = {
  requesterId: { toString: () => OTHER_ID },
  addresseeId: { toString: () => USER_ID },
  status: "approved",
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
  return res;
}

function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

function mockActivityFind(data: unknown[]) {
  mockActivity.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(data) });
}

describe("logActivity", () => {
  beforeEach(() => {
    mockActivity.create.mockResolvedValue(STORED_ACTIVITY);
  });

  it("returns 201 with the created activity on success", async () => {
    const res = makeRes();
    await logActivity(makeReq({ type: "created", eventId: EVENT_ID }, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ activity: STORED_ACTIVITY });
  });

  it("sets expiresAt to a Date approximately ACTIVITY_TTL_DAYS days from now", async () => {
    const before = Date.now();
    await logActivity(makeReq({ type: "created", eventId: EVENT_ID }, {}, USER_ID), makeRes(), makeNext());
    const after = Date.now();

    const { expiresAt } = mockActivity.create.mock.calls[0][0];
    const expectedMs = ACTIVITY_TTL_DAYS * 24 * 60 * 60 * 1000;

    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + expectedMs);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + expectedMs);
  });

  it("returns 400 when type is missing", async () => {
    const res = makeRes();
    await logActivity(makeReq({ eventId: EVENT_ID }, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockActivity.create).not.toHaveBeenCalled();
  });

  it("returns 400 when type is not a valid activity type", async () => {
    const res = makeRes();
    await logActivity(makeReq({ type: "liked", eventId: EVENT_ID }, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockActivity.create).not.toHaveBeenCalled();
  });

  it("returns 400 when eventId is missing", async () => {
    const res = makeRes();
    await logActivity(makeReq({ type: "registered" }, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockActivity.create).not.toHaveBeenCalled();
  });

  it("calls next(err) when Activity.create throws", async () => {
    const error = new Error("DB error");
    mockActivity.create.mockRejectedValue(error);
    const next = makeNext();

    await logActivity(makeReq({ type: "created", eventId: EVENT_ID }, {}, USER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("getActivityFeed", () => {
  beforeEach(() => {
    mockConnection.find.mockResolvedValue([CONN_AS_REQUESTER]);
    mockActivityFind([STORED_ACTIVITY]);
  });

  it("returns 200 with activities from connected users", async () => {
    const res = makeRes();
    await getActivityFeed(makeReq({}, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ activities: [STORED_ACTIVITY] });
  });

  it("returns 200 with an empty array when the user has no connections", async () => {
    mockConnection.find.mockResolvedValue([]);
    mockActivityFind([]);
    const res = makeRes();
    await getActivityFeed(makeReq({}, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ activities: [] });
  });

  it("returns 200 with an empty array when connections exist but have no activities", async () => {
    mockActivityFind([]);
    const res = makeRes();
    await getActivityFeed(makeReq({}, {}, USER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ activities: [] });
  });

  it("queries only approved connections for the current user", async () => {
    await getActivityFeed(makeReq({}, {}, USER_ID), makeRes(), makeNext());

    expect(mockConnection.find).toHaveBeenCalledWith({
      $or: [{ requesterId: USER_ID }, { addresseeId: USER_ID }],
      status: "approved",
    });
  });

  it("extracts the other user's id when current user is the requester", async () => {
    mockConnection.find.mockResolvedValue([CONN_AS_REQUESTER]);
    await getActivityFeed(makeReq({}, {}, USER_ID), makeRes(), makeNext());

    expect(mockActivity.find).toHaveBeenCalledWith({
      actorId: { $in: [OTHER_ID] },
    });
  });

  it("extracts the other user's id when current user is the addressee", async () => {
    mockConnection.find.mockResolvedValue([CONN_AS_ADDRESSEE]);
    await getActivityFeed(makeReq({}, {}, USER_ID), makeRes(), makeNext());

    expect(mockActivity.find).toHaveBeenCalledWith({
      actorId: { $in: [OTHER_ID] },
    });
  });

  it("calls next(err) when Connection.find throws", async () => {
    const error = new Error("DB error");
    mockConnection.find.mockRejectedValue(error);
    const next = makeNext();

    await getActivityFeed(makeReq({}, {}, USER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("calls next(err) when Activity.find throws", async () => {
    const error = new Error("DB error");
    mockActivity.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(error) });
    const next = makeNext();

    await getActivityFeed(makeReq({}, {}, USER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("getActivitiesByUserId", () => {
  it("returns 200 with activities for the given user", async () => {
    mockActivityFind([STORED_ACTIVITY]);
    const res = makeRes();
    await getActivitiesByUserId(makeReq({}, { userId: OTHER_ID }), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ activities: [STORED_ACTIVITY] });
  });

  it("returns 200 with an empty array when the user has no activities", async () => {
    mockActivityFind([]);
    const res = makeRes();
    await getActivitiesByUserId(makeReq({}, { userId: OTHER_ID }), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ activities: [] });
  });

  it("queries by the userId route param", async () => {
    mockActivityFind([]);
    await getActivitiesByUserId(makeReq({}, { userId: OTHER_ID }), makeRes(), makeNext());

    expect(mockActivity.find).toHaveBeenCalledWith({ actorId: OTHER_ID });
  });

  it("calls next(err) when Activity.find throws", async () => {
    const error = new Error("DB error");
    mockActivity.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(error) });
    const next = makeNext();

    await getActivitiesByUserId(makeReq({}, { userId: OTHER_ID }), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
