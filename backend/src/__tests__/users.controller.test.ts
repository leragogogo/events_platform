/**
 * Unit tests for the users controller.
 *
 * All models and bcrypt are fully mocked, no database connection required.
 */

import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import {
  getMyProfile,
  updateMyName,
  updateMyPassword,
  getUserProfile,
} from "../controllers/users.controller.js";
import { User } from "../models/User.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Connection } from "../models/Connection.js";

jest.mock("../models/User.js", () => ({
  User: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));

jest.mock("../models/Event.js", () => ({
  Event: { find: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock("../models/Registration.js", () => ({
  Registration: { find: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock("../models/Connection.js", () => ({
  Connection: { findOne: jest.fn() },
}));

jest.mock("bcryptjs");

const mockUser = User as unknown as { findById: jest.Mock; findByIdAndUpdate: jest.Mock };
const mockEvent = Event as unknown as { find: jest.Mock; countDocuments: jest.Mock };
const mockRegistration = Registration as unknown as { find: jest.Mock; countDocuments: jest.Mock };
const mockConnection = Connection as unknown as { findOne: jest.Mock };

const MY_ID = "aaa-me";
const TARGET_ID = "zzz-target";

const STORED_USER = { _id: MY_ID, name: "Alice", email: "alice@example.com" };
const TARGET_USER = { _id: TARGET_ID, name: "Bob" };
const STORED_EVENT = { _id: "event-1", title: "Tech Meetup" };
const STORED_REGISTRATION = { _id: "reg-1", userId: MY_ID, eventId: STORED_EVENT };

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

function mockUserFindById(value: unknown) {
  mockUser.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(value) });
}

function mockUserFindByIdAndUpdate(value: unknown) {
  mockUser.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(value) });
}

function mockRegistrationFind(value: unknown[]) {
  mockRegistration.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(value) });
}

describe("getMyProfile", () => {
  beforeEach(() => {
    mockUserFindById(STORED_USER);
    mockEvent.find.mockResolvedValue([STORED_EVENT]);
    mockRegistrationFind([STORED_REGISTRATION]);
  });

  it("returns 200 with user, createdEvents, and participatedEvents", async () => {
    const res = makeRes();
    await getMyProfile(makeReq({}, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: STORED_USER,
      createdEvents: [STORED_EVENT],
      participatedEvents: [STORED_EVENT],
    });
  });

  it("returns 404 when user is not found", async () => {
    mockUserFindById(null);
    const res = makeRes();
    await getMyProfile(makeReq({}, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("calls next(err) when a query throws", async () => {
    const error = new Error("DB error");
    mockUser.findById.mockReturnValue({ select: jest.fn().mockRejectedValue(error) });
    const next = makeNext();

    await getMyProfile(makeReq({}, {}, MY_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("updateMyName", () => {
  beforeEach(() => {
    mockUserFindByIdAndUpdate(STORED_USER);
  });

  it("returns 200 with updated user on success", async () => {
    const res = makeRes();
    await updateMyName(makeReq({ name: "Alice" }, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: STORED_USER });
  });

  it("returns 400 when name is missing", async () => {
    const res = makeRes();
    await updateMyName(makeReq({}, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUser.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when name is blank whitespace", async () => {
    const res = makeRes();
    await updateMyName(makeReq({ name: "   " }, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUser.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when user is not found", async () => {
    mockUserFindByIdAndUpdate(null);
    const res = makeRes();
    await updateMyName(makeReq({ name: "Alice" }, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("calls next(err) when User.findByIdAndUpdate throws", async () => {
    const error = new Error("DB error");
    mockUser.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockRejectedValue(error) });
    const next = makeNext();

    await updateMyName(makeReq({ name: "Alice" }, {}, MY_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("updateMyPassword", () => {
  beforeEach(() => {
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
    mockUserFindByIdAndUpdate(STORED_USER);
  });

  it("returns 200 with updated user on success", async () => {
    const res = makeRes();
    await updateMyPassword(makeReq({ password: "newpass123" }, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: STORED_USER });
  });

  it("hashes the password with bcrypt salt 10", async () => {
    await updateMyPassword(makeReq({ password: "newpass123" }, {}, MY_ID), makeRes(), makeNext());

    expect(bcrypt.hash as jest.Mock).toHaveBeenCalledWith("newpass123", 10);
  });

  it("stores the hash as passwordHash, not the plain password", async () => {
    await updateMyPassword(makeReq({ password: "newpass123" }, {}, MY_ID), makeRes(), makeNext());

    expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(
      MY_ID,
      { $set: { passwordHash: "hashed-password" } },
      expect.objectContaining({ new: true }),
    );
  });

  it("returns 400 when password is missing", async () => {
    const res = makeRes();
    await updateMyPassword(makeReq({}, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUser.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when password is shorter than 6 characters", async () => {
    const res = makeRes();
    await updateMyPassword(makeReq({ password: "abc" }, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockUser.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when user is not found", async () => {
    mockUserFindByIdAndUpdate(null);
    const res = makeRes();
    await updateMyPassword(makeReq({ password: "newpass123" }, {}, MY_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("calls next(err) when User.findByIdAndUpdate throws", async () => {
    const error = new Error("DB error");
    mockUser.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockRejectedValue(error) });
    const next = makeNext();

    await updateMyPassword(makeReq({ password: "newpass123" }, {}, MY_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("getUserProfile", () => {
  beforeEach(() => {
    mockUserFindById(TARGET_USER);
    mockConnection.findOne.mockResolvedValue(null);
    mockEvent.countDocuments.mockResolvedValue(3);
    mockRegistration.countDocuments.mockResolvedValue(2);
    mockEvent.find.mockResolvedValue([STORED_EVENT]);
    mockRegistrationFind([STORED_REGISTRATION]);
  });

  describe("when not connected", () => {
    it("returns 200 with counts only", async () => {
      const res = makeRes();
      await getUserProfile(makeReq({}, { id: TARGET_ID }, MY_ID), res, makeNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: TARGET_USER,
        createdEventsCount: 3,
        participatedEventsCount: 2,
      });
    });

    it("does not fetch full event lists when not connected", async () => {
      await getUserProfile(makeReq({}, { id: TARGET_ID }, MY_ID), makeRes(), makeNext());

      expect(mockEvent.find).not.toHaveBeenCalled();
      expect(mockRegistration.find).not.toHaveBeenCalled();
    });
  });

  describe("when connected", () => {
    beforeEach(() => {
      mockConnection.findOne.mockResolvedValue({ status: "approved" });
    });

    it("returns 200 with full event history", async () => {
      const res = makeRes();
      await getUserProfile(makeReq({}, { id: TARGET_ID }, MY_ID), res, makeNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: TARGET_USER,
        createdEvents: [STORED_EVENT],
        participatedEvents: [STORED_EVENT],
      });
    });
  });
});
