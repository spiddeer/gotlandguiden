import type { Coordinates } from "@/lib/places"

export type Weather = {
  temperature: number
  windSpeed: number
  sunset: string
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number
    wind_speed_10m?: number
  }
  daily?: {
    sunset?: string[]
  }
}

export async function loadWeather(position: Coordinates, signal?: AbortSignal): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(position.lat),
    longitude: String(position.lng),
    current: "temperature_2m,wind_speed_10m",
    daily: "sunset",
    timezone: "Europe/Stockholm",
    forecast_days: "1",
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal })
  if (!response.ok) throw new Error("Vädret kunde inte hämtas")

  const data = (await response.json()) as OpenMeteoResponse
  const temperature = data.current?.temperature_2m
  const windSpeed = data.current?.wind_speed_10m
  const sunset = data.daily?.sunset?.[0]
  if (temperature == null || windSpeed == null || !sunset) throw new Error("Väderdata saknas")

  return {
    temperature,
    windSpeed,
    sunset: new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(sunset),
    ),
  }
}
