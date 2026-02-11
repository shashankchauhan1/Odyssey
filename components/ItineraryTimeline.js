'use client';

import { memo, useEffect } from 'react';
import { MapPin, Lightbulb, Navigation } from 'lucide-react';

const ItineraryTimeline = memo(function ItineraryTimeline({ itinerary, destinationName }) {

    // Performance: Log only when itinerary length changes
    useEffect(() => {
        if (itinerary && itinerary.length > 0) {
            console.log("Timeline Rendered with items:", itinerary.length);
        }
    }, [itinerary?.length]);

    if (!itinerary || itinerary.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No itinerary generated yet.</p>
            </div>
        );
    }

    const openMap = (query) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + ' ' + destinationName)}`, '_blank');
    };

    return (
        <div className="space-y-4">
            {itinerary.map((day, index) => {
                const activitiesList = day.activities || day.events || [];

                return (
                    <div key={day._id || index} className="border border-slate-100 rounded-3xl bg-white overflow-hidden">

                        {/* Header (Static) */}
                        <div className="p-6 flex items-center justify-between bg-white border-b border-slate-50">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Day {day.day}</h3>
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50">
                                    {day.theme || "Adventure"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="text-xs font-medium">{activitiesList.length} Activities</span>
                            </div>
                        </div>

                        {/* Content (Always Visible) */}
                        <div className="p-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.isArray(activitiesList) && activitiesList.length > 0 ? (
                                    activitiesList.map((activity, i) => (
                                        <ActivityCard
                                            key={i}
                                            data={activity}
                                            index={i}
                                            openMap={openMap}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full h-[150px] bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 animate-pulse">
                                        <span className="text-2xl mb-2 opacity-50">✨</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Planning...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

export default ItineraryTimeline;

function ActivityCard({ data, index, openMap }) {
    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 transition-all duration-300 flex flex-col h-full relative group hover:border-indigo-200 hover:shadow-md hover:bg-slate-50 hover:-translate-y-1">

            {/* Header */}
            <div className="mb-2">
                <div className="flex justify-between items-start gap-3">
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                        {data.title}
                    </h3>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-500 mb-4 font-medium leading-relaxed whitespace-pre-line">
                {data.description}
            </p>

            {/* Footer */}
            <div className="mt-auto space-y-3">

                {/* Pro Tip (Centered without Price) */}
                {data.proTip && (
                    <div className="flex items-center gap-2 bg-amber-50/50 rounded-lg p-2 border border-amber-100/50">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-900/80 font-medium leading-tight">
                            <span className="font-bold text-amber-600">Tip: </span>
                            {data.proTip}
                        </p>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={() => openMap(data.title)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-400 bg-slate-50 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
                >
                    <MapPin className="w-3.5 h-3.5" /> View on Map
                </button>
            </div>
        </div>
    );
}
