interface GeocodedLocation {
  lat: number
  lng: number
}

interface CommuteDistance {
  drivingMiles: number
  transitMinutes: number
}

export async function geocodeAddress(address: string): Promise<GeocodedLocation> {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  )

  if (!response.ok) {
    throw new Error(`Google Geocoding API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.status !== 'OK' || !data.results[0]) {
    throw new Error(`Geocoding failed: ${data.status}`)
  }

  const location = data.results[0].geometry.location

  return {
    lat: location.lat,
    lng: location.lng,
  }
}

export async function getCommuteDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<CommuteDistance> {
  const origin = `${originLat},${originLng}`
  const destination = `${destLat},${destLng}`

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=${process.env.GOOGLE_MAPS_API_KEY}`
  )

  if (!response.ok) {
    throw new Error(`Google Distance Matrix API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.status !== 'OK' || !data.rows[0]?.elements[0]) {
    throw new Error(`Distance Matrix failed: ${data.status}`)
  }

  const element = data.rows[0].elements[0]
  const distanceMeters = element.distance?.value || 0
  const drivingMiles = distanceMeters / 1609.34

  // Estimate transit time (roughly 1.5x driving time)
  const drivingMinutes = (element.duration?.value || 0) / 60
  const transitMinutes = drivingMinutes * 1.5

  return {
    drivingMiles,
    transitMinutes,
  }
}
