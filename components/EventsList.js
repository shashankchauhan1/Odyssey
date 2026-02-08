'use client';

import { useState } from 'react';

export default function EventsList({ destinationName }) {
    const [filter, setFilter] = useState('All');

    // Mock Data
    const events = [
        { title: "Local Food Festival", category: "Food", date: "This Weekend", popularity: "High", image: "🍔" },
        { title: "City Heritage Walk", category: "Culture", date: "Daily", popularity: "Medium", image: "🚶" },
        { title: "Live Music Night", category: "Music", date: "Friday Night", popularity: "High", image: "🎸" },
        { title: "Flea Market", category: "Shopping", date: "Sunday", popularity: "Medium", image: "🛍️" },
        { title: "Art Exhibition", category: "Art", date: "Ongoing", popularity: "Low", image: "🎨" },
    ];

    const categories = ['All', 'Food', 'Culture', 'Music', 'Shopping', 'Art'];

    const filteredEvents = filter === 'All' ? events : events.filter(e => e.category === filter);

    return (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        🎟️ Upcoming Events
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Don't miss out on {destinationName}'s best experiences.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${filter === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event, i) => (
                    <a
                        key={i}
                        href={`https://www.google.com/search?q=${encodeURIComponent(event.title + ' ' + destinationName + ' event')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-200 rounded-2xl p-5 border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all group flex flex-col cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-4xl bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                                {event.image}
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border ${event.popularity === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                event.popularity === 'Medium' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                {event.popularity} Demand
                            </span>
                        </div>

                        <div className="flex-1">
                            <h4 className="font-bold text-lg text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <span className="bg-white px-2 py-1 rounded-md border border-slate-100">🗓️ {event.date}</span>
                                <span>{event.category}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600 group-hover:underline">View details</span>
                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            <div className="mt-8 text-center border-t border-slate-50 pt-6">
                <a
                    href={`https://www.google.com/search?q=events+in+${destinationName}&ibp=htl;events`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition"
                >
                    View more on Google <span className="bg-slate-100 px-1.5 rounded text-[10px]">↗</span>
                </a>
            </div>
        </div>
    );
}
