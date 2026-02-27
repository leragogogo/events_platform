/**
 * Unit tests for the auth controller: register, login, logout.
 *
 * All external dependencies (User model, bcrypt, jsonwebtoken) are replaced
 * with Jest mocks.
 */

import { Request, Response, NextFunction } from "express";
import { register, login, logout } from "../controllers/auth.controller.js";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../models/User.js", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

/** Typed handles for the mocked User static methods. */
const mockUserModel = User as unknown as { findOne: jest.Mock; create: jest.Mock };


/** Builds a minimal mock Request with the given body. */
function makeReq(body: Record<string, unknown> = {}): Request {
  return { body } as Request;
}

/**
 * Builds a mock Response whose methods (status, json, cookie,
 * clearCookie, sendStatus) all return `this` so chaining works.
 */
function makeRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.cookie = jest.fn().mockReturnThis();
  res.clearCookie = jest.fn().mockReturnThis();
  res.sendStatus = jest.fn().mockReturnThis();
  return res;
}

/** Wraps jest.fn() as a NextFunction. */
function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
});

describe("register", () => {
  const DEFAULT_BODY = { email: "a@b.com", password: "pass123", name: "Alice" };
  const MOCK_USER = { _id: "uid1", email: "a@b.com", name: "Alice" };

  beforeEach(() => {
    mockUserModel.findOne.mockResolvedValue(null);
    mockUserModel.create.mockResolvedValue(MOCK_USER);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
    (jwt.sign as jest.Mock).mockReturnValue("signed-token");
  });

  it("returns 201 and user object on success", async () => {
    const res = makeRes();
    await register(makeReq(DEFAULT_BODY), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user: MOCK_USER });
  });

  it("sets httpOnly JWT cookie on success", async () => {
    const res = makeRes();
    await register(makeReq(DEFAULT_BODY), res, makeNext());

    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "signed-token",
      expect.objectContaining({ httpOnly: true })
    );
  });

  it("calls bcrypt.hash with the plain password and salt 10", async () => {
    await register(makeReq(DEFAULT_BODY), makeRes(), makeNext());

    expect(bcrypt.hash as jest.Mock).toHaveBeenCalledWith("pass123", 10);
  });

  it("creates user with passwordHash, not the plain password", async () => {
    await register(makeReq(DEFAULT_BODY), makeRes(), makeNext());

    expect(mockUserModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: "hashed" })
    );
    expect(mockUserModel.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ password: "pass123" })
    );
  });

  it("signs JWT with { userId } and JWT_SECRET", async () => {
    await register(makeReq(DEFAULT_BODY), makeRes(), makeNext());

    expect(jwt.sign as jest.Mock).toHaveBeenCalledWith(
      { userId: "uid1" },
      "test-secret",
      expect.anything()
    );
  });

  it("returns 409 and does not call User.create when email is already taken", async () => {
    mockUserModel.findOne.mockResolvedValue(MOCK_USER);
    const res = makeRes();
    await register(makeReq(DEFAULT_BODY), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockUserModel.create).not.toHaveBeenCalled();
  });

  it("calls next(err) when User.findOne throws", async () => {
    const error = new Error("DB error");
    mockUserModel.findOne.mockRejectedValue(error);
    const next = makeNext();

    await register(makeReq(DEFAULT_BODY), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("calls next(err) when User.create throws", async () => {
    const error = new Error("Create error");
    mockUserModel.create.mockRejectedValue(error);
    const next = makeNext();

    await register(makeReq(DEFAULT_BODY), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});


describe("login", () => {
  const DEFAULT_BODY = { email: "a@b.com", password: "pass123" };
  const MOCK_USER = { _id: "uid1", email: "a@b.com", name: "Alice", passwordHash: "hashed" };

  beforeEach(() => {
    mockUserModel.findOne.mockResolvedValue(MOCK_USER);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("signed-token");
  });

  it("returns 200 and user object on valid credentials", async () => {
    const res = makeRes();
    await login(makeReq(DEFAULT_BODY), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: { _id: "uid1", email: "a@b.com", name: "Alice" },
    });
  });

  it("sets JWT cookie on success", async () => {
    const res = makeRes();
    await login(makeReq(DEFAULT_BODY), res, makeNext());

    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "signed-token",
      expect.objectContaining({ httpOnly: true })
    );
  });

  it("calls bcrypt.compare with the plain password and the stored hash", async () => {
    await login(makeReq(DEFAULT_BODY), makeRes(), makeNext());

    expect(bcrypt.compare as jest.Mock).toHaveBeenCalledWith("pass123", "hashed");
  });

  it("returns 401 and skips bcrypt.compare when email is not found", async () => {
    mockUserModel.findOne.mockResolvedValue(null);
    const res = makeRes();
    await login(makeReq(DEFAULT_BODY), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(bcrypt.compare as jest.Mock).not.toHaveBeenCalled();
  });

  it("returns 401 when the password is wrong", async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const res = makeRes();
    await login(makeReq(DEFAULT_BODY), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns identical error message for unknown email and wrong password (anti-enumeration)", async () => {
    // Case 1: email not found
    mockUserModel.findOne.mockResolvedValue(null);
    const resA = makeRes();
    await login(makeReq(DEFAULT_BODY), resA, makeNext());
    const msgForUnknownEmail = (resA.json as jest.Mock).mock.calls[0][0];

    // Case 2: wrong password
    mockUserModel.findOne.mockResolvedValue(MOCK_USER);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const resB = makeRes();
    await login(makeReq(DEFAULT_BODY), resB, makeNext());
    const msgForWrongPass = (resB.json as jest.Mock).mock.calls[0][0];

    expect(msgForUnknownEmail).toEqual(msgForWrongPass);
  });

  it("calls next(err) when User.findOne throws", async () => {
    const error = new Error("DB error");
    mockUserModel.findOne.mockRejectedValue(error);
    const next = makeNext();

    await login(makeReq(DEFAULT_BODY), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("calls next(err) when bcrypt.compare throws", async () => {
    const error = new Error("bcrypt error");
    (bcrypt.compare as jest.Mock).mockRejectedValue(error);
    const next = makeNext();

    await login(makeReq(DEFAULT_BODY), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("logout", () => {
  it("sends 204 No Content", () => {
    const res = makeRes();
    logout(makeReq(), res);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });

  it("clears the token cookie", () => {
    const res = makeRes();
    logout(makeReq(), res);

    expect(res.clearCookie).toHaveBeenCalledWith("token", {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  });
});
