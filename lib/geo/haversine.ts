// Great-circle distance between two lat/lng points using the Haversine
// formula. Pure math, no deps, safe to call from server or client.
//
// Earth radius is the IUGG mean radius — accurate to within a few hundred
// meters at planetary scales, which is way more precision than we need for
// "events within 25 miles."

export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_MI = 3958.7613
const EARTH_RADIUS_KM = 6371.0088

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function haversine(a: LatLng, b: LatLng, radius: number): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function distanceMiles(a: LatLng, b: LatLng): number {
  return haversine(a, b, EARTH_RADIUS_MI)
}

export function distanceKm(a: LatLng, b: LatLng): number {
  return haversine(a, b, EARTH_RADIUS_KM)
}

/** Pretty-print a mileage distance for UI display ("0.4 mi", "5 mi", "120 mi") */
export function formatMiles(mi: number): string {
  if (mi < 0.1) return "< 0.1 mi"
  if (mi < 10) return `${mi.toFixed(1)} mi`
  if (mi < 100) return `${Math.round(mi)} mi`
  return `${Math.round(mi)} mi`
}
