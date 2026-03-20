/**
 * Unit tests for the search controller.
 *
 * User and Event models are mocked — no database connection required.
 */

import { Request, Response, NextFunction } from "express";
import { search } from "../controllers/search.controller.js";
import { User } from "../models/User.js";
import { Event } from "../models/Event.js";

jest.mock("../models/User.js", () => ({
  User: { find: jest.fn() },
}));

jest.mock("../models/Event.js", () => ({
  Event: { find: jest.fn() },
  EVENT_CATEGORIES: [],
}));

const mockUser = User as unknown as { find: jest.Mock };
const mockEvent = Event as unknown as { find: jest.Mock };

const USERS = [{ _id: "u1", name: "Alice" }];
const EVENTS = [{ _id: "e1", title: "Tech Meetup" }];

let userLimitMock: jest.Mock;
let userSelectMock: jest.Mock;
let eventLimitMock: jest.Mock;

function setupUserFind(result: unknown[] = USERS) {
  userLimitMock = jest.fn().mockResolvedValue(result);
  userSelectMock = jest.fn().mockReturnValue({ limit: userLimitMock });
  mockUser.find.mockReturnValue({ select: userSelectMock });
}

function setupEventFind(result: unknown[] = EVENTS) {
  eventLimitMock = jest.fn().mockResolvedValue(result);
  mockEvent.find.mockReturnValue({ limit: eventLimitMock });
}

function makeReq(query: Record<string, string> = {}): Request {
  return { query } as unknown as Request;
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

describe("search", () => {
  beforeEach(() => {
    setupUserFind();
    setupEventFind();
  });

  it("returns 200 with users and events for a valid query", async () => {
    const res = makeRes();
    await search(makeReq({ q: "Alice" }), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ users: USERS, events: EVENTS });
  });

  it("returns empty arrays without querying the DB when q is an empty string", async () => {
    const res = makeRes();
    await search(makeReq({ q: "" }), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ users: [], events: [] });
    expect(mockUser.find).not.toHaveBeenCalled();
    expect(mockEvent.find).not.toHaveBeenCalled();
  });

  it("returns empty arrays without querying the DB when q is absent", async () => {
    const res = makeRes();
    await search(makeReq({}), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ users: [], events: [] });
    expect(mockUser.find).not.toHaveBeenCalled();
    expect(mockEvent.find).not.toHaveBeenCalled();
  });

  it("builds a case-insensitive regex from the query", async () => {
    await search(makeReq({ q: "alice" }), makeRes(), makeNext());

    const pattern = mockUser.find.mock.calls[0][0].name as RegExp;
    expect(pattern).toBeInstanceOf(RegExp);
    expect(pattern.flags).toContain("i");
    expect(pattern.test("Alice")).toBe(true);
    expect(pattern.test("ALICE")).toBe(true);
  });

  it("uses the same regex pattern for both User and Event queries", async () => {
    await search(makeReq({ q: "tech" }), makeRes(), makeNext());

    const userPattern = mockUser.find.mock.calls[0][0].name as RegExp;
    const eventPattern = mockEvent.find.mock.calls[0][0].title as RegExp;
    expect(userPattern.source).toBe(eventPattern.source);
    expect(userPattern.flags).toBe(eventPattern.flags);
  });

  it("excludes passwordHash and email from user results", async () => {
    await search(makeReq({ q: "Alice" }), makeRes(), makeNext());

    expect(userSelectMock).toHaveBeenCalledWith("-passwordHash -email");
  });

  it("calls next(err) when a DB query throws", async () => {
    const error = new Error("DB error");
    const failLimit = jest.fn().mockRejectedValue(error);
    const failSelect = jest.fn().mockReturnValue({ limit: failLimit });
    mockUser.find.mockReturnValue({ select: failSelect });

    const next = makeNext();
    await search(makeReq({ q: "Alice" }), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
