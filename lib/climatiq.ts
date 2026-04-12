interface ClimatiqEstimate {
  carCo2KgPerTrip: number
  transitCo2KgPerTrip: number
  dailySavingsIfSwitched: number
}

export async function estimateCommuteCO2(
  distanceMiles: number
): Promise<ClimatiqEstimate> {
  const response = await fetch('https://beta4.api.climatiq.io/estimate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CLIMATIQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      emission_factor: {
        activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
      },
      parameters: {
        distance: distanceMiles,
        distance_unit: 'mi',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Climatiq API error: ${response.status}`)
  }

  const data = await response.json()
  const carCo2KgPerTrip = data.co2e

  // Estimate transit CO2 (roughly 10% of car)
  const transitCo2KgPerTrip = carCo2KgPerTrip * 0.1

  return {
    carCo2KgPerTrip,
    transitCo2KgPerTrip,
    dailySavingsIfSwitched: carCo2KgPerTrip - transitCo2KgPerTrip,
  }
}
