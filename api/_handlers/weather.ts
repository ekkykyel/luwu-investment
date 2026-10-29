function mapWmoCodeToWeather(code: number): { main: string; description: string; icon: string } {
  if (code === 0) return { main: "Clear", description: "Cerah", icon: "01d" };
  if (code === 1 || code === 2) return { main: "Clouds", description: "Cerah Berawan", icon: "02d" };
  if (code === 3) return { main: "Clouds", description: "Berawan Tebal", icon: "04d" };
  if (code === 45 || code === 48) return { main: "Fog", description: "Berkabut", icon: "50d" };
  if (code >= 51 && code <= 55) return { main: "Drizzle", description: "Gerimis Ringan", icon: "09d" };
  if (code >= 61 && code <= 65) return { main: "Rain", description: "Hujan Sedang", icon: "10d" };
  if (code >= 80 && code <= 82) return { main: "Rain", description: "Hujan Lebat", icon: "09d" };
  if (code >= 95) return { main: "Thunderstorm", description: "Hujan Petir", icon: "11d" };
  return { main: "Clouds", description: "Cerah Berawan", icon: "02d" };
}

const BASELINE_LUWU_WEATHER = {
  weather: [
    {
      id: 801,
      main: "Clouds",
      description: "Cerah Berawan",
      icon: "02d"
    }
  ],
  main: {
    temp: 28.5,
    humidity: 76,
    pressure: 1011,
    feels_like: 30.5
  },
  wind: {
    speed: 2.2,
    deg: 135
  },
  name: "Belopa, Kab. Luwu",
  cod: 200
};

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const lat = -3.3943;
    const lon = 120.3686;
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia%2FMakassar`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(openMeteoUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "InvestLuwu-Hub/1.0" }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.current) {
        const curr = data.current;
        const condition = mapWmoCodeToWeather(curr.weather_code ?? 2);

        const formatted = {
          weather: [
            {
              id: 800 + (curr.weather_code ?? 2),
              main: condition.main,
              description: condition.description,
              icon: condition.icon
            }
          ],
          main: {
            temp: curr.temperature_2m ?? 28.5,
            humidity: curr.relative_humidity_2m ?? 75,
            pressure: Math.round(curr.surface_pressure ?? 1010),
            feels_like: Math.round((curr.temperature_2m ?? 28.5) + 1.2)
          },
          wind: {
            speed: Math.round(((curr.wind_speed_10m ?? 6) / 3.6) * 10) / 10,
            deg: curr.wind_direction_10m ?? 140
          },
          name: "Belopa, Kab. Luwu",
          cod: 200
        };

        res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        return res.status(200).json(formatted);
      }
    }

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(BASELINE_LUWU_WEATHER);
  } catch (err: any) {
    console.warn("[/api/weather/current] Non-fatal weather fetch note:", err?.message || err);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(BASELINE_LUWU_WEATHER);
  }
}
