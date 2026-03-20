import client from "./client";

export interface GeocodeResult {
  coordinates: [number, number];
  city: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const res = await client.get<{ coordinates: [number, number] | null; city: string | null }>(
    "/geocode",
    { params: { address } }
  );
  if (!res.data.coordinates) return null;
  return { coordinates: res.data.coordinates, city: res.data.city ?? "" };
}
