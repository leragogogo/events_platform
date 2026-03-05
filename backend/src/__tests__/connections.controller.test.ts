/**
 * Unit tests for the connections controller.
 *
 * The Connection model is fully mocked, no database connection required.
 */

import { Request, Response, NextFunction } from "express";
import {
  initiateConnection,
  getMyConnections,
  getConnectionsByUserId,
  updateConnectionStatus,
  removeConnection,
} from "../controllers/connections.controller.js";
import { Connection } from "../models/Connection.js";

jest.mock("../models/Connection.js", () => ({
  Connection: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

const mockConnection = Connection as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findOne: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

// IDs chosen so REQUESTER_ID < ADDRESSEE_ID
const REQUESTER_ID = "aaa-requester";
const ADDRESSEE_ID = "zzz-addressee";
const CONN_ID = "conn-123";

const PENDING_CONN = {
  _id: CONN_ID,
  requesterId: { toString: () => REQUESTER_ID },
  addresseeId: { toString: () => ADDRESSEE_ID },
  status: "pending",
};

const APPROVED_CONN = { ...PENDING_CONN, status: "approved" };
const DECLINED_CONN = { ...PENDING_CONN, status: "declined" };

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

describe("initiateConnection", () => {
  beforeEach(() => {
    mockConnection.findOne.mockResolvedValue(null);
    mockConnection.create.mockResolvedValue(PENDING_CONN);
  });

  it("returns 201 with the connection on success", async () => {
    const res = makeRes();
    await initiateConnection(makeReq({ addresseeId: ADDRESSEE_ID }, {}, REQUESTER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ connection: PENDING_CONN });
  });

  it("returns 400 when addresseeId is missing", async () => {
    const res = makeRes();
    await initiateConnection(makeReq({}, {}, REQUESTER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockConnection.findOne).not.toHaveBeenCalled();
  });

  it("returns 409 when a connection between the two users already exists", async () => {
    mockConnection.findOne.mockResolvedValue(PENDING_CONN);
    const res = makeRes();
    await initiateConnection(makeReq({ addresseeId: ADDRESSEE_ID }, {}, REQUESTER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockConnection.create).not.toHaveBeenCalled();
  });

  it("checks for existing connection using the sorted userLowId/userHighId pair", async () => {
    await initiateConnection(makeReq({ addresseeId: ADDRESSEE_ID }, {}, REQUESTER_ID), makeRes(), makeNext());

    expect(mockConnection.findOne).toHaveBeenCalledWith({
      userLowId: REQUESTER_ID,
      userHighId: ADDRESSEE_ID,
    });
  });

  it("stores userLowId/userHighId in sorted order when requesterId < addresseeId", async () => {
    await initiateConnection(makeReq({ addresseeId: ADDRESSEE_ID }, {}, REQUESTER_ID), makeRes(), makeNext());

    expect(mockConnection.create).toHaveBeenCalledWith(expect.objectContaining({
      userLowId: REQUESTER_ID,
      userHighId: ADDRESSEE_ID,
    }));
  });

  it("stores userLowId/userHighId in sorted order when addresseeId < requesterId", async () => {
    await initiateConnection(makeReq({ addresseeId: "aaa-other" }, {}, "zzz-me"), makeRes(), makeNext());

    expect(mockConnection.create).toHaveBeenCalledWith(expect.objectContaining({
      userLowId: "aaa-other",
      userHighId: "zzz-me",
    }));
  });

  it("calls next(err) when Connection.findOne throws", async () => {
    const error = new Error("DB error");
    mockConnection.findOne.mockRejectedValue(error);
    const next = makeNext();

    await initiateConnection(makeReq({ addresseeId: ADDRESSEE_ID }, {}, REQUESTER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("calls next(err) when Connection.create throws", async () => {
    const error = new Error("DB error");
    mockConnection.create.mockRejectedValue(error);
    const next = makeNext();

    await initiateConnection(makeReq({ addresseeId: ADDRESSEE_ID }, {}, REQUESTER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("getMyConnections", () => {
  it("returns 200 with all connections for the authenticated user", async () => {
    mockConnection.find.mockResolvedValue([PENDING_CONN, APPROVED_CONN]);
    const res = makeRes();
    await getMyConnections(makeReq({}, {}, REQUESTER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ connections: [PENDING_CONN, APPROVED_CONN] });
  });

  it("returns 200 with an empty array when no connections exist", async () => {
    mockConnection.find.mockResolvedValue([]);
    const res = makeRes();
    await getMyConnections(makeReq({}, {}, REQUESTER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ connections: [] });
  });

  it("queries by both requesterId and addresseeId for the current user", async () => {
    mockConnection.find.mockResolvedValue([]);
    await getMyConnections(makeReq({}, {}, REQUESTER_ID), makeRes(), makeNext());

    expect(mockConnection.find).toHaveBeenCalledWith({
      $or: [{ requesterId: REQUESTER_ID }, { addresseeId: REQUESTER_ID }],
    });
  });

  it("calls next(err) when Connection.find throws", async () => {
    const error = new Error("DB error");
    mockConnection.find.mockRejectedValue(error);
    const next = makeNext();

    await getMyConnections(makeReq({}, {}, REQUESTER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("getConnectionsByUserId", () => {
  it("returns 200 with approved connections for the given user", async () => {
    mockConnection.find.mockResolvedValue([APPROVED_CONN]);
    const res = makeRes();
    await getConnectionsByUserId(makeReq({}, { userId: REQUESTER_ID }), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ connections: [APPROVED_CONN] });
  });

  it("returns 200 with an empty array when no approved connections exist", async () => {
    mockConnection.find.mockResolvedValue([]);
    const res = makeRes();
    await getConnectionsByUserId(makeReq({}, { userId: REQUESTER_ID }), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ connections: [] });
  });

  it("queries only approved connections by the userId param", async () => {
    mockConnection.find.mockResolvedValue([]);
    await getConnectionsByUserId(makeReq({}, { userId: REQUESTER_ID }), makeRes(), makeNext());

    expect(mockConnection.find).toHaveBeenCalledWith({
      $or: [{ requesterId: REQUESTER_ID }, { addresseeId: REQUESTER_ID }],
      status: "approved",
    });
  });

  it("calls next(err) when Connection.find throws", async () => {
    const error = new Error("DB error");
    mockConnection.find.mockRejectedValue(error);
    const next = makeNext();

    await getConnectionsByUserId(makeReq({}, { userId: REQUESTER_ID }), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("updateConnectionStatus", () => {
  beforeEach(() => {
    mockConnection.findById.mockResolvedValue(PENDING_CONN);
    mockConnection.findByIdAndUpdate.mockResolvedValue({ ...PENDING_CONN, status: "approved" });
  });

  it("returns 200 with the updated connection when approving", async () => {
    const updated = { ...PENDING_CONN, status: "approved" };
    mockConnection.findByIdAndUpdate.mockResolvedValue(updated);
    const res = makeRes();
    await updateConnectionStatus(
      makeReq({ status: "approved" }, { id: CONN_ID }, ADDRESSEE_ID),
      res,
      makeNext(),
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ updated });
  });

  it("returns 200 with the updated connection when declining", async () => {
    const updated = { ...PENDING_CONN, status: "declined" };
    mockConnection.findByIdAndUpdate.mockResolvedValue(updated);
    const res = makeRes();
    await updateConnectionStatus(
      makeReq({ status: "declined" }, { id: CONN_ID }, ADDRESSEE_ID),
      res,
      makeNext(),
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ updated });
  });

  it("returns 400 when status is not approved or declined", async () => {
    const res = makeRes();
    await updateConnectionStatus(
      makeReq({ status: "pending" }, { id: CONN_ID }, ADDRESSEE_ID),
      res,
      makeNext(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockConnection.findById).not.toHaveBeenCalled();
  });

  it("returns 400 when status is missing", async () => {
    const res = makeRes();
    await updateConnectionStatus(makeReq({}, { id: CONN_ID }, ADDRESSEE_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockConnection.findById).not.toHaveBeenCalled();
  });

  it("returns 404 when connection does not exist", async () => {
    mockConnection.findById.mockResolvedValue(null);
    const res = makeRes();
    await updateConnectionStatus(
      makeReq({ status: "approved" }, { id: CONN_ID }, ADDRESSEE_ID),
      res,
      makeNext(),
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockConnection.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 when the requester is not the addressee", async () => {
    const res = makeRes();
    await updateConnectionStatus(
      makeReq({ status: "approved" }, { id: CONN_ID }, REQUESTER_ID),
      res,
      makeNext(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockConnection.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 409 when the connection has already been resolved", async () => {
    mockConnection.findById.mockResolvedValue(APPROVED_CONN);
    const res = makeRes();
    await updateConnectionStatus(
      makeReq({ status: "declined" }, { id: CONN_ID }, ADDRESSEE_ID),
      res,
      makeNext(),
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockConnection.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("calls next(err) when Connection.findByIdAndUpdate throws", async () => {
    const error = new Error("DB error");
    mockConnection.findByIdAndUpdate.mockRejectedValue(error);
    const next = makeNext();

    await updateConnectionStatus(
      makeReq({ status: "approved" }, { id: CONN_ID }, ADDRESSEE_ID),
      makeRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("removeConnection", () => {
  beforeEach(() => {
    mockConnection.findById.mockResolvedValue(APPROVED_CONN);
    mockConnection.findByIdAndDelete.mockResolvedValue(APPROVED_CONN);
  });

  it("returns 204 when the requester removes the connection", async () => {
    const res = makeRes();
    await removeConnection(makeReq({}, { id: CONN_ID }, REQUESTER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("returns 204 when the addressee removes the connection", async () => {
    const res = makeRes();
    await removeConnection(makeReq({}, { id: CONN_ID }, ADDRESSEE_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("calls Connection.findByIdAndDelete with the connection id", async () => {
    await removeConnection(makeReq({}, { id: CONN_ID }, REQUESTER_ID), makeRes(), makeNext());

    expect(mockConnection.findByIdAndDelete).toHaveBeenCalledWith(CONN_ID);
  });

  it("returns 404 when connection does not exist", async () => {
    mockConnection.findById.mockResolvedValue(null);
    const res = makeRes();
    await removeConnection(makeReq({}, { id: CONN_ID }, REQUESTER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockConnection.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("returns 403 when the requester is not part of the connection", async () => {
    const res = makeRes();
    await removeConnection(makeReq({}, { id: CONN_ID }, "unrelated-user"), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockConnection.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("returns 409 when the connection is not approved", async () => {
    mockConnection.findById.mockResolvedValue(PENDING_CONN);
    const res = makeRes();
    await removeConnection(makeReq({}, { id: CONN_ID }, REQUESTER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockConnection.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("returns 409 when the connection was declined", async () => {
    mockConnection.findById.mockResolvedValue(DECLINED_CONN);
    const res = makeRes();
    await removeConnection(makeReq({}, { id: CONN_ID }, REQUESTER_ID), res, makeNext());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(mockConnection.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("calls next(err) when Connection.findByIdAndDelete throws", async () => {
    const error = new Error("DB error");
    mockConnection.findByIdAndDelete.mockRejectedValue(error);
    const next = makeNext();

    await removeConnection(makeReq({}, { id: CONN_ID }, REQUESTER_ID), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
