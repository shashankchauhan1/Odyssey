'use client';

import React, { useState, useEffect } from 'react';

export default function EventsCard({ destinationName }) {
  // 1. Get the LIVE real-world date
  const [dateInfo, setDateInfo] = useState(null);

  useEffect(() => {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    
    // Simple Season Detector
    const monthIndex = now.getMonth(); // 0 = Jan, 11 = Dec
    let season = "General";
    let icon = "🎭";
    let color = "from-purple-600 to-indigo-700"; // Default

    // Winter (Dec, Jan, Feb)
    if (monthIndex === 11 || monthIndex <= 1) {
      season = "Winter";
      icon = "❄️";
      color = "from-cyan-600 to-blue-700";
    }
    // Summer/Spring (Mar - Jun)
    else if (monthIndex >= 2 && monthIndex <= 5) {
      season = "Summer";
      icon = "☀️";
      color = "from-orange-500 to-amber-600";
    }
    // Monsoon (Jul - Sep)
    else if (monthIndex >= 6 && monthIndex <= 8) {
      season = "Monsoon";
      icon = "☔";
      color = "from-teal-600 to-emerald-700";
    }
    // Autumn (Oct - Nov)
    else {
      season = "Autumn";
      icon = "🍂";
      color = "from-red-600 to-orange-700";
    }

    setDateInfo({ month, year, season, icon, color });
  }, []);

  if (!dateInfo) return null; // Wait for client-side date

  // 2. Create the Dynamic Link
  // This searches specifically for "Events in Shimla December 2025"
  const googleEventsLink = `https://www.google.com/search?q=events+in+${destinationName}+${dateInfo.month}+${dateInfo.year}&ibp=htl;events`;

  return (
    <div className={`bg-gradient-to-br ${dateInfo.color} text-white p-6 rounded-xl shadow-lg mb-8 relative overflow-hidden group transition-all`}>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-all"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide backdrop-blur-sm">
              {dateInfo.season} Season
            </span>
            <span className="text-xs opacity-80">Happening Now</span>
          </div>
          
          <h3 className="text-xl font-bold flex items-center gap-2">
            {dateInfo.icon} Events in {destinationName}
          </h3>
          <p className="text-white/90 text-sm mt-1">
            Check out festivals, concerts, and shows happening this <strong>{dateInfo.month}</strong>.
          </p>
        </div>

        <a 
          href={googleEventsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-sm hover:bg-slate-50 hover:scale-105 transition shadow-lg flex items-center gap-2 whitespace-nowrap"
        >
          📅 See {dateInfo.month} Events
        </a>
      </div>
    </div>
  );
}