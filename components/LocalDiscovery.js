'use client';

import { useState, useEffect } from 'react';

export default function LocalDiscovery({ destinationName }) {
    const [activeTab, setActiveTab] = useState('restaurant'); // restaurant, parking, place_of_worship
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    // Mapping for user-friendly labels to OSM queries
    const tabs = [
        { id: 'restaurant', label: '🍽️ Restaurants', query: 'restaurants', color: 'bg-orange-50 text-orange-600 border-orange-100' },
        { id: 'cafe', label: '☕ Cafes', query: 'cafes', color: 'bg-amber-50 text-amber-700 border-amber-100' },
        { id: 'parking', label: '🅿️ Parking', query: 'parking', color: 'bg-blue-50 text-blue-600 border-blue-100' },
        { id: 'place_of_worship', label: '🛕 Temples & Culture', query: 'temple', color: 'bg-purple-50 text-purple-600 border-purple-100' }
    ];

    useEffect(() => {
        if (!destinationName) return;

        const fetchPlaces = async () => {
            setLoading(true);
            setError(false);
            setPlaces([]); // Clear previous
            try {
                const query = tabs.find(t => t.id === activeTab).query;
                // Search OSM Nominatim
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}+in+${destinationName}&format=json&layer=address&limit=8`);
                if (!res.ok) throw new Error('Failed to fetch');

                const data = await res.json();
                setPlaces(data);
            } catch (err) {
                console.error("Local Discovery Error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPlaces();
    }, [destinationName, activeTab]);

    return (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">📍 Explore Nearby</h3>
                <p className="text-slate-500 text-sm">Find the best spots around {destinationName}.</p>
            </div>

            {/* TABS */}
            <div className="flex flex-wrap gap-2 mb-8">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${activeTab === tab.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg transform scale-[1.02]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50">
                            <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                                <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-12 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-bold">Could not load places. Please try again later.</p>
                </div>
            ) : places.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <p className="text-slate-500 text-sm">No places found for this category nearby.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {places.map((place, i) => {
                        const activeColor = tabs.find(t => t.id === activeTab).color;
                        return (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-400 bg-white hover:border-indigo-100 hover:shadow-lg transition-all group">
                                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm text-2xl shrink-0 border ${activeColor} bg-opacity-100`}>
                                    {activeTab === 'restaurant' && '🍽️'}
                                    {activeTab === 'cafe' && '☕'}
                                    {activeTab === 'parking' && '🅿️'}
                                    {activeTab === 'place_of_worship' && '🛕'}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-bold text-slate-900 text-sm truncate pr-2 group-hover:text-indigo-600 transition-colors">
                                        {place.display_name.split(',')[0]}
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate mt-1">
                                        {place.display_name.split(',').slice(1, 4).join(',')}
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.display_name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-bold text-indigo-500 mt-3 inline-flex items-center gap-1 hover:text-indigo-700 hover:underline"
                                    >
                                        View on Map ↗
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-8 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Powered by OpenStreetMap</p>
            </div>
        </div>
    );
}
