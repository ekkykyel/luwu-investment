import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain } from 'lucide-react';

export const CompactWeatherWidget = () => {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetch('/api/weather/current', { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then((data) => setWeather(data))
      .catch(() => {
        // Fallback directly to Open-Meteo or baseline without console error
        fetch('https://api.open-meteo.com/v1/forecast?latitude=-3.4333&longitude=120.3500&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FMakassar', { credentials: 'same-origin' })
          .then((r) => r.json())
          .then((m) => {
            if (m?.current) {
              setWeather({
                main: { temp: m.current.temperature_2m || 28 },
                weather: [{ main: (m.current.weather_code || 0) > 50 ? 'Rain' : (m.current.weather_code || 0) > 2 ? 'Clouds' : 'Clear' }],
                name: 'Belopa'
              });
            }
          })
          .catch(() => {
            setWeather({
              main: { temp: 28 },
              weather: [{ main: 'Clouds' }],
              name: 'Belopa'
            });
          });
      });
  }, []);

  if (!weather) return null;

  const getIcon = (main: string) => {
    switch (main.toLowerCase()) {
      case 'rain': return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'clouds': return <Cloud className="h-4 w-4 text-slate-500" />;
      default: return <Sun className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full border border-slate-200/50 dark:border-white/10 shadow-sm">
      {getIcon(weather.weather[0].main)}
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
        {Math.round(weather.main.temp)}°C
      </span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        {weather.name || 'Luwu'}
      </span>
    </div>
  );
};
