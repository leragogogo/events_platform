import { Request, Response, NextFunction } from "express";
import { geocode } from "../controllers/geocoding.controller.js";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeReq(query: Record<string, unknown> = {}): Request {
  return { query } as unknown as Request;
}

function makeRes(): { res: Response; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  const res = { json, status } as unknown as Response;
  return { res, json, status };
}

const next: NextFunction = jest.fn();

const NOMINATIM_HIT = {
  lon: "-0.1276",
  lat: "51.5074",
  address: { city: "London" },
};

function mockNominatimOk(results: unknown[]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValueOnce(results),
  });
}

describe("geocode controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when address query param is missing", async () => {
    const { res, status, json } = makeRes();
    await geocode(makeReq(), res, next);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: "address query parameter is required" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls Nominatim with the address and correct headers", async () => {
    mockNominatimOk([NOMINATIM_HIT]);
    const { res } = makeRes();
    await geocode(makeReq({ address: "10 Downing Street, London" }), res, next);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("nominatim.openstreetmap.org/search");
    expect(url).toContain("q=10+Downing+Street%2C+London");
    expect((options as RequestInit).headers).toMatchObject({ "User-Agent": expect.stringContaining("EventsPlatform") });
  });

  it("returns coordinates and city on success", async () => {
    mockNominatimOk([NOMINATIM_HIT]);
    const { res, json } = makeRes();
    await geocode(makeReq({ address: "10 Downing Street, London" }), res, next);
    expect(json).toHaveBeenCalledWith({
      coordinates: [-0.1276, 51.5074],
      city: "London",
    });
  });

  it("falls back through town, village, county for city", async () => {
    mockNominatimOk([{ lon: "2.3", lat: "48.8", address: { town: "Montrouge" } }]);
    const { res, json } = makeRes();
    await geocode(makeReq({ address: "Somewhere in France" }), res, next);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ city: "Montrouge" }));
  });

  it("returns null coordinates and city when Nominatim finds nothing", async () => {
    mockNominatimOk([]);
    const { res, json } = makeRes();
    await geocode(makeReq({ address: "zzz not a real place zzz" }), res, next);
    expect(json).toHaveBeenCalledWith({ coordinates: null, city: null });
  });

  it("calls next with error when Nominatim returns a non-ok status", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    const { res } = makeRes();
    await geocode(makeReq({ address: "London" }), res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("calls next with error when fetch throws (network failure)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { res } = makeRes();
    await geocode(makeReq({ address: "London" }), res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
