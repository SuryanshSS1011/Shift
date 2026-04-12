import { getCached } from './redis'

interface WeatherData {
  temperature: number
  weatherCode: number
  description: string
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode&temperature_unit=fahrenheit`
  )

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`)
  }

  const data = await response.json()

  return {
    temperature: data.current.temperature_2m,
    weatherCode: data.current.weathercode,
    description: WEATHER_CODES[data.current.weathercode] || 'Unknown',
  }
}

// 30-minute TTL cache
export async function getWeather(lat: number, lng: number): Promise<WeatherData> {
  const cacheKey = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`
  return getCached(cacheKey, () => fetchWeather(lat, lng), 1800)
}
