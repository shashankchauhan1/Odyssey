'use client';

import { useState, useEffect } from 'react';
import { Plane, Train, Bus, Car, ChevronRight, MapPin, Clock, Banknote, ExternalLink, Info } from 'lucide-react';

export default function TransportTabs({ transportInfo, destinationName, nearestStation, units = 'metric' }) {
    const [activeTab, setActiveTab] = useState('flight');
    const [userLocation, setUserLocation] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [loadingLoc, setLoadingLoc] = useState(false);
    const [locError, setLocError] = useState(null);
    const [calculatedDistance, setCalculatedDistance] = useState(null);

    // Fetch destination coordinates on mount
    useEffect(() => {
        if (!destinationName) return;
        const fetchDestCoords = async () => {
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destinationName)}&count=1&language=en&format=json`);
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    setDestCoords({
                        lat: data.results[0].latitude,
                        lng: data.results[0].longitude
                    });
                }
            } catch (err) {
                console.error("Failed to geocode destination", err);
            }
        };
        fetchDestCoords();
    }, [destinationName]);

    // Calculate distance when both locations available
    useEffect(() => {
        if (userLocation && destCoords) {
            const R = 6371; // Radius of the earth in km
            const dLat = deg2rad(destCoords.lat - userLocation.lat);
            const dLon = deg2rad(destCoords.lng - userLocation.lng);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(userLocation.lat)) * Math.cos(deg2rad(destCoords.lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c; // Distance in km
            setCalculatedDistance(Math.round(d));
        }
    }, [userLocation, destCoords]);

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    }

    // fallback if info is missing
    const info = transportInfo || {
        flight: { available: false },
        train: { available: false },
        bus: { available: false },
        car: { available: false }
    };

    const tabs = [
        { id: 'flight', label: 'Flight', icon: Plane, data: info.flight },
        { id: 'train', label: 'Train', icon: Train, data: info.train },
        { id: 'bus', label: 'Bus', icon: Bus, data: info.bus },
        { id: 'car', label: 'Car', icon: Car, data: info.car },
    ];

    const handleGetLocation = () => {
        setLoadingLoc(true);
        setLocError(null);
        if (!navigator.geolocation) {
            setLocError("Geolocation is not supported by your browser.");
            setLoadingLoc(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLoadingLoc(false);
            },
            (err) => {
                setLocError("Unable to retrieve your location.");
                setLoadingLoc(false);
            }
        );
    };

    const getAction = (type) => {
        const baseUrl = "https://www.google.com/maps/dir/?api=1";
        const dest = encodeURIComponent(destinationName);

        let url = "";
        let label = "Check";
        let Icon = ExternalLink;

        // Use precise coordinates if available, else fallback to name
        const destinationParam = destCoords ? `${destCoords.lat},${destCoords.lng}` : dest;

        if (userLocation) {
            const origin = `${userLocation.lat},${userLocation.lng}`;
            if (type === 'flight') {
                url = `https://www.google.com/search?q=flights+from+my+location+to+${dest}`;
                label = "Search Flights";
                Icon = Plane;
            } else if (type === 'train') {
                // Trains often need specific station names, but Maps Transit is a good default
                url = `${baseUrl}&origin=${origin}&destination=${destinationParam}&travelmode=transit`;
                label = "View Train Routes";
                Icon = Train;
            } else if (type === 'bus') {
                url = `${baseUrl}&origin=${origin}&destination=${destinationParam}&travelmode=transit`;
                label = "View Bus Routes";
                Icon = Bus;
            } else {
                url = `${baseUrl}&origin=${origin}&destination=${destinationParam}&travelmode=driving`;
                label = "Open Navigation";
                Icon = MapPin;
            }
        } else {
            // General Search or Map View if no user location
            if (type === 'flight') {
                url = `https://www.google.com/search?q=flights+to+${dest}`;
                label = "Search Flights";
                Icon = Plane;
            } else if (type === 'train') {
                url = `https://www.google.com/maps/search/?api=1&query=railway+station+near+${destinationParam}`;
                label = "Find Stations";
                Icon = Train;
            } else if (type === 'bus') {
                url = `https://www.google.com/maps/search/?api=1&query=bus+stop+near+${destinationParam}`;
                label = "Find Bus Stops";
                Icon = Bus;
            } else {
                url = `https://www.google.com/maps/search/?api=1&query=${destinationParam}`;
                label = "View on Maps";
                Icon = MapPin;
            }
        }
        return { url, label, Icon };
    };

    const activeData = tabs.find(t => t.id === activeTab)?.data || {};

    // DYNAMIC DATA OVERRIDES
    // If we have calculated distance, we override the static 'duration' description with our distance info
    // We cannot accurately guess time without API, so we give a rough estimate or just distance.
    let displayDuration = activeData.duration;
    let displayCost = activeData.price_range;
    let displayNote = activeData.details;

    if (calculatedDistance) {
        let distDisplay = calculatedDistance;
        let unitLabel = "km";

        if (units === 'imperial') {
            distDisplay = Math.round(calculatedDistance * 0.621371);
            unitLabel = "mi";
        }

        displayDuration = `~${distDisplay} ${unitLabel} away`;
        displayCost = "Check App"; // Reset cost as static data is irrelevant

        // Mode-specific Logic
        if (activeTab === 'flight') {
            const flightTime = Math.round((calculatedDistance / 700) * 10) / 10; // ~700km/h
            const airport = "International Airport"; // Mock
            displayDuration = `~${flightTime}h flight`;
            displayNote = `Nearest airport is approx ${distDisplay}${unitLabel}. Flights available daily.`;
        } else if (activeTab === 'train') {
            const trainTime = Math.round((calculatedDistance / 80) * 10) / 10; // ~80km/h
            const station = nearestStation || "Central Station";
            displayDuration = `~${trainTime}h by train`;
            displayNote = `Route to ${station}. Trains typically run every few hours.`;
        } else if (activeTab === 'bus') {
            const busTime = Math.round((calculatedDistance / 50) * 10) / 10; // ~50km/h
            displayDuration = `~${busTime}h by bus`;
            displayNote = `Direct buses available. Expect stops along the way.`;
        } else if (activeTab === 'car') {
            const carTime = Math.round((calculatedDistance / 60) * 10) / 10; // ~60km/h
            displayDuration = `~${carTime}h drive`;
            displayNote = `Drive via main highway. Traffic may affect duration.`;
        }
    }

    if (!userLocation) {
        return (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">How to Reach?</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                    Allow access to your location to see the best travel options, estimated time, and routes to <span className="font-semibold text-slate-700">{destinationName}</span>.
                </p>

                {locError && (
                    <div className="bg-red-50 text-red-600 text-xs py-2 px-3 rounded-lg mb-4 inline-block font-medium">
                        {locError}
                    </div>
                )}

                <button
                    onClick={handleGetLocation}
                    disabled={loadingLoc}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                >
                    {loadingLoc ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Locating...
                        </>
                    ) : (
                        <>
                            <MapPin className="w-4 h-4" /> Use My Location
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
            {/* Tabs Header */}
            <div className="flex p-1 bg-slate-50 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-500' : ''}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">

                {/* Availability Badge */}
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        From Your Location
                    </span>
                    {activeData.available ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Available
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Limited
                        </span>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex gap-3 mb-1">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                {calculatedDistance ? <MapPin className="w-4 h-4 text-orange-500" /> : <Clock className="w-4 h-4 text-orange-500" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{calculatedDistance ? "Distance" : "Est. Time"}</p>
                                <p className="text-sm font-bold text-slate-900">{displayDuration || "Calculate in Maps"}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex gap-3 mb-1">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                <Banknote className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Est. Cost</p>
                                <p className="text-sm font-bold text-slate-900">{displayCost || "Check provider"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 mb-6 flex gap-3">
                    <div className="shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-xs text-indigo-900/70 font-medium leading-relaxed">
                        {displayNote || `View ${activeTab} routes and schedule directly in Google Maps.`}
                    </p>
                </div>

                {/* Action Button */}
                {/* Action Button */}
                {(() => {
                    const action = getAction(activeTab);
                    return (
                        <a
                            href={action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition active:scale-[0.98] shadow-xl shadow-slate-200/50"
                        >
                            <span>{action.label}</span>
                            <action.Icon className="w-4 h-4 text-slate-400" />
                        </a>
                    );
                })()}

            </div>
        </div>
    );
}
