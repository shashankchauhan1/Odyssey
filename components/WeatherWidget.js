'use client';

import { useState, useEffect } from 'react';

export default function WeatherWidget({ city }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!city) return;

    let mounted = true;
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(false);

        // extracting the coordinates for weather
        let geoData = null;
        let searchQueries = [
          city,                               // 1. Try exact input (e.g. "Manali, India")
          city.split(',')[0],                 // 2. Try before comma (e.g. "Manali")
          city.split(' ')[0]                  // 3. Try first word (e.g. "Vaishno")
        ];

        // Loop through queries until we find a match
        for (const query of searchQueries) {
          try {
            const res = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
            );
            if (!res.ok) continue;
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              geoData = data.results[0];
              console.log(`✅ Found location using: "${query}" -> ${geoData.name}`);
              break; // Stop looking, we found it!
            }
          } catch (e) {
            console.warn("Geocoding fetch error:", e);
          }
        }

        if (!geoData) {
          console.warn("❌ Weather not found for:", city);
          throw new Error("Location not found");
        }

        const { latitude, longitude, elevation } = geoData;

        // Fetch Weather ---
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&elevation=${elevation}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) {
          throw new Error(`Weather fetch failed with status ${weatherRes.status}`);
        }
        const weatherData = await weatherRes.json();

        if (!weatherData?.daily || !weatherData?.current) throw new Error("Missing daily data");

        if (mounted) {
          setWeather({
            temp: Math.round(weatherData.current.temperature_2m),
            code: weatherData.current.weather_code,
            min: Math.round(weatherData.daily.temperature_2m_min[0]),
            max: Math.round(weatherData.daily.temperature_2m_max[0]),
            wind: weatherData.current.wind_speed_10m,
            humidity: weatherData.current.relative_humidity_2m
          });
          setRetryCount(0); // Reset retries on success
        }

      } catch (err) {
        console.error("Weather Widget Error:", err);
        if (mounted) {
          // Auto-retry logic
          if (retryCount < 2) {
            console.log(`Retrying weather... (${retryCount + 1}/3)`);
            setRetryCount(prev => prev + 1);
          } else {
            setError(true);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // If we are retrying, set a small timeout backoff
    const timer = setTimeout(() => {
      fetchWeather();
    }, retryCount * 1000); // 0ms, 1000ms, 2000ms

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [city, retryCount]);

  const handleManualRetry = () => {
    setRetryCount(0);
    setLoading(true);
    setError(false);
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 45) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "🌨️";
    if (code <= 99) return "⛈️";
    return "🌥️";
  };

  if (loading) return <div className="h-24 bg-blue-50 animate-pulse rounded-xl mb-6 flex items-center justify-center text-blue-300 text-sm font-medium">Loading weather...</div>;

  if (error) return (
    <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 flex items-center justify-between">
      <span className="text-sm font-medium">Unable to load weather.</span>
      <button
        onClick={handleManualRetry}
        className="text-xs bg-white border border-red-200 px-3 py-1 rounded-lg hover:bg-red-100 transition font-bold"
      >
        Retry
      </button>
    </div>
  );

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-lg border border-white/10 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

      <div className="relative z-10">
        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1.5 flex items-center gap-2">
          Weather <span className='text-[.6rem]'>(~updated an hour ago)</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-4xl filter drop-shadow-lg">{getWeatherIcon(weather.code)}</span>
          <div>
            <span className="text-4xl font-black tracking-tight">{weather.temp}°</span>
            <p className="text-slate-300 text-xs font-medium mt-0.5">
              H: {weather.max}° <span className="opacity-50 mx-1">|</span> L: {weather.min}°
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 sm:mt-0 text-right space-y-2 hidden xs:block">
        <div className="text-xs font-semibold text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 justify-end">
          <span className="opacity-50">Wind</span> {weather.wind} km/h 💨
        </div>
        <div className="text-xs font-semibold text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 justify-end">
          <span className="opacity-50">Humidity</span> {weather.humidity}% 💧
        </div>
      </div>
    </div>
  );
}