import React from 'react';

export default function BookingCard({ destinationName, nearestStation }) {
  // 1. Create Smart Search URLs
  const trainSearchUrl = `https://www.google.com/search?q=trains+to+${nearestStation || destinationName}`;
  const busSearchUrl = `https://www.google.com/search?q=bus+tickets+to+${destinationName}`;
  const flightSearchUrl = `https://www.skyscanner.co.in/transport/flights/in/${destinationName}`;
  const hotelSearchUrl = `https://www.booking.com/searchresults.html?ss=${destinationName}`;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">🎟️ Book Your Travel</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* BUS BUTTON */}
        <a 
          href={busSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-red-50 hover:bg-red-100 transition border border-red-100 group"
        >
          <span className="text-2xl mb-2 group-hover:scale-110 transition">🚌</span>
          <span className="text-sm font-bold text-red-700">Find Buses</span>
        </a>

        {/* TRAIN BUTTON */}
        <a 
          href={trainSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition border border-blue-100 group"
        >
          <span className="text-2xl mb-2 group-hover:scale-110 transition">🚆</span>
          <span className="text-sm font-bold text-blue-700">Check Trains</span>
          {nearestStation && <span className="text-[10px] text-blue-400">to {nearestStation}</span>}
        </a>

        {/* FLIGHT BUTTON */}
        <a 
          href={flightSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-sky-50 hover:bg-sky-100 transition border border-sky-100 group"
        >
          <span className="text-2xl mb-2 group-hover:scale-110 transition">✈️</span>
          <span className="text-sm font-bold text-sky-700">Flights</span>
        </a>

        {/* HOTEL BUTTON */}
        <a 
          href={hotelSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition border border-indigo-100 group"
        >
          <span className="text-2xl mb-2 group-hover:scale-110 transition">🏨</span>
          <span className="text-sm font-bold text-indigo-700">Hotels</span>
        </a>
      </div>
    </div>
  );
}