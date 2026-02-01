'use client';

import { useState, useEffect } from 'react';

export default function WeatherWidget({ city }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!city) return;

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
        }

        if (!geoData) {
          console.warn("❌ Weather not found for:", city);
          setError(true);
          setLoading(false);
          return;
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
        if (
          !Array.isArray(weatherData.daily.temperature_2m_min) ||
          !Array.isArray(weatherData.daily.temperature_2m_max)
        ) {
          throw new Error("Incomplete temperature data");
        }

        setWeather({
          temp: Math.round(weatherData.current.temperature_2m),
          code: weatherData.current.weather_code,
          min: Math.round(weatherData.daily.temperature_2m_min[0]),
          max: Math.round(weatherData.daily.temperature_2m_max[0]),
          wind: weatherData.current.wind_speed_10m,
          humidity: weatherData.current.relative_humidity_2m
        });

      } catch (err) {
        console.error("Weather Widget Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city]);

  const getWeatherIcon = (code) => {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 45) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "🌨️";
    if (code <= 99) return "⛈️";
    return "🌥️";
  };

  if (loading) return <div className="h-24 bg-blue-50 animate-pulse rounded-xl mb-6"></div>;

  // If we can't find the weather, just hide the widget instead of crashing
  if (error || !weather) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg mb-8 flex justify-between items-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

      <div>
        <h3 className="text-blue-100 font-bold text-sm uppercase tracking-wider mb-1 flex items-baseline gap-2">
          Current Weather
          <span className="text-xs font-normal normal-case text-grey">
            • Updated 1h ago
          </span>
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{getWeatherIcon(weather.code)}</span>
          <div>
            <span className="text-4xl font-extrabold">{weather.temp}°C</span>
            <p className="text-blue-100 text-sm">
              H: {weather.max}° L: {weather.min}°
            </p>
          </div>
        </div>
      </div>

      <div className="text-right z-10 hidden md:block">
        <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm inline-block mb-2">
          💨 Wind: {weather.wind} km/h
        </div>
        <br />
        <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm inline-block">
          💧 Humidity: {weather.humidity}%
        </div>
      </div>
    </div>
  );
}