import { Request, Response, NextFunction } from "express";

/**
 * GET /api/geocode?address=<string>
 *
 * Proxies a geocoding request to OpenStreetMap Nominatim and returns the
 * first matching result.
 *
 * @returns 200 { coordinates: [lon, lat], city: string } on success
 * @returns 200 { coordinates: null, city: null } when address is not found
 * @returns 400 when the address query param is missing
 */
export async function geocode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const address = req.query.address;
    if (!address || typeof address !== "string") {
      res.status(400).json({ message: "address query parameter is required" });
      return;
    }

    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      addressdetails: "1",
    });

    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": `EventsPlatform/1.0 (${process.env.CONTACT_EMAIL})`,
          "Accept-Language": "en",
        },
      }
    );

    if (!nominatimRes.ok) {
      throw new Error(`Nominatim responded with ${nominatimRes.status}`);
    }

    const results = await nominatimRes.json();

    if (!results.length) {
      res.status(200).json({ coordinates: null, city: null });
      return;
    }

    const hit = results[0];
    const addr = hit.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? "";

    res.status(200).json({
      coordinates: [parseFloat(hit.lon), parseFloat(hit.lat)] as [number, number],
      city,
    });
  } catch (err) {
    next(err);
  }
}
