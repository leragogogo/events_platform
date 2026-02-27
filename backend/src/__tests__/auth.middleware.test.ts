/**
 * Unit tests for authMiddleware.
 *
 * jwt.verify is mocked so no real token verification occurs.
 */

import { Request, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

/** Builds a mock Response with chainable status/json. */
function makeRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
}

/** Wraps jest.fn() as a NextFunction. */
function makeNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

function makeReq(cookies?: Record<string, string>): Request {
  return { cookies } as unknown as Request;
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
});

describe("authMiddleware", () => {
  it("calls next() with no args on a valid token", () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "uid1" });
    const next = makeNext();

    authMiddleware(makeReq({ token: "valid-token" }), makeRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("attaches req.user.userId from the JWT payload", () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "uid1" });
    const req = makeReq({ token: "valid-token" });

    authMiddleware(req, makeRes(), makeNext());

    expect((req as AuthRequest).user).toEqual({ userId: "uid1" });
  });

  it("calls jwt.verify with the cookie token and JWT_SECRET", () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "uid1" });

    authMiddleware(makeReq({ token: "valid-token" }), makeRes(), makeNext());

    expect(jwt.verify as jest.Mock).toHaveBeenCalledWith("valid-token", "test-secret");
  });

  it("returns 401 when req.cookies is undefined", () => {
    const res = makeRes();

    authMiddleware(makeReq(undefined), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when req.cookies.token is undefined", () => {
    const res = makeRes();

    authMiddleware(makeReq({}), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("does not call next() or jwt.verify when token is missing", () => {
    const next = makeNext();

    authMiddleware(makeReq({}), makeRes(), next);

    expect(next).not.toHaveBeenCalled();
    expect(jwt.verify as jest.Mock).not.toHaveBeenCalled();
  });

  it("returns 401 when jwt.verify throws", () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const res = makeRes();

    authMiddleware(makeReq({ token: "bad-token" }), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("does not call next() on an invalid token", () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const next = makeNext();

    authMiddleware(makeReq({ token: "bad-token" }), makeRes(), next);

    expect(next).not.toHaveBeenCalled();
  });

  it("does not attach req.user on an invalid token", () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const req = makeReq({ token: "bad-token" });

    authMiddleware(req, makeRes(), makeNext());

    expect((req as AuthRequest).user).toBeUndefined();
  });
});
