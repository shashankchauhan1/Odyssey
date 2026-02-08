'use client';

import { useState } from 'react';
import { MapPin, Navigation, Car, Train, Bus } from 'lucide-react';

export default function TravelAssistance({ destinationName }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    const handleGetDirections = async () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // 1. Get Destination Coords
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destinationName)}&count=1&language=en&format=json`);
                const data = await res.json();

                if (!data.results || data.results.length === 0) {
                    throw new Error("Could not find destination coordinates");
                }

                const destLat = data.results[0].latitude;
                const destLng = data.results[0].longitude;

                // 2. Calculate Distance
                const dist = calculateDistance(userLat, userLng, destLat, destLng);
                const distanceKm = Math.round(dist);

                // 3. Estimate Times (Avg speeds: Car 60km/h, Train 80km/h, Bus 40km/h)
                setInfo({
                    from: "Your Location",
                    distance: distanceKm,
                    car: Math.ceil(dist / 60),
                    train: Math.ceil(dist / 80),
                    bus: Math.ceil(dist / 40)
                });

            } catch (err) {
                console.error(err);
                setError("Failed to calculate route");
            } finally {
                setLoading(false);
            }
        }, () => {
            setError("Unable to retrieve your location");
            setLoading(false);
        });
    };

    if (!destinationName) return null;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Navigation className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-bold text-slate-900">How to Reach</h3>
                </div>

                {!info ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Calculate travel distance and time to <strong>{destinationName}</strong> from your current location.
                        </p>
                        <button
                            onClick={handleGetDirections}
                            disabled={loading}
                            className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-md"
                        >
                            {loading ? (
                                <span className="animate-pulse">Locating...</span>
                            ) : (
                                "Get Directions"
                            )}
                        </button>
                        {error && <p className="text-xs text-rose-500 mt-3 font-medium bg-rose-50 p-2 rounded-lg">{error}</p>}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        <div className="flex items-center justify-between bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Distance</span>
                            <span className="text-lg font-black text-indigo-900">{info.distance} km</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <Car className="w-5 h-5 text-slate-400" />
                                    <span className="font-semibold text-slate-700 text-sm">Car</span>
                                </div>
                                <span className="font-bold text-slate-900 text-sm">{info.car}h</span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <Train className="w-5 h-5 text-slate-400" />
                                    <span className="font-semibold text-slate-700 text-sm">Train</span>
                                </div>
                                <span className="font-bold text-slate-900 text-sm">{info.train}h</span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <Bus className="w-5 h-5 text-slate-400" />
                                    <span className="font-semibold text-slate-700 text-sm">Bus</span>
                                </div>
                                <span className="font-bold text-slate-900 text-sm">{info.bus}h</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setInfo(null)}
                            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition border-t border-slate-100 mt-2"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
