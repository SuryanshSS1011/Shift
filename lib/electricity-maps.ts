interface GridIntensity {
  zone: string
  carbonIntensity: number
  renewablePercent: number
  fossilFuelPercent: number
}

// Zone lookup by approximate lat/lng bounding boxes
const ZONE_MAP: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  'US-NY-NYIS': { minLat: 40.4, maxLat: 45.0, minLng: -79.8, maxLng: -71.8 },
  'US-CAL-CISO': { minLat: 32.5, maxLat: 42.0, minLng: -124.5, maxLng: -114.0 },
  'US-TEX-ERCO': { minLat: 25.8, maxLat: 36.5, minLng: -106.6, maxLng: -93.5 },
  'US-MIDA-PJM': { minLat: 36.5, maxLat: 42.5, minLng: -84.8, maxLng: -74.0 },
}

export function getZoneFromCoordinates(lat: number, lng: number): string {
  for (const [zone, bounds] of Object.entries(ZONE_MAP)) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng) {
      return zone
    }
  }
  return 'US-NY-NYIS' // Default fallback
}

export async function getGridIntensity(zone: string): Promise<GridIntensity> {
  const response = await fetch(
    `https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${zone}`,
    {
      headers: {
        'auth-token': process.env.ELECTRICITY_MAPS_API_KEY!,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Electricity Maps API error: ${response.status}`)
  }

  const data = await response.json()

  return {
    zone,
    carbonIntensity: data.carbonIntensity,
    renewablePercent: data.renewablePercentage || 0,
    fossilFuelPercent: data.fossilFuelPercentage || 100,
  }
}
