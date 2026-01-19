import React from 'react';

export default function BookingCard({ destinationName, nearestStation }) {
  // create searching urls

  const trainSearchUrl = `https://www.google.com/search?q=trains+to+${nearestStation || destinationName}`;
  const busSearchUrl = `https://www.google.com/search?q=bus+tickets+to+${destinationName}`;
  const flightSearchUrl = `https://www.google.com/search?q=flights+to+${destinationName}+indigo+air+india`;
  const hotelSearchUrl = `https://www.booking.com/searchresults.html?ss=${destinationName}`;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm mt-4 sm:mt-6">
      <h3 className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4">🎟️ Book Your Travel</h3>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* bus button */}
        <a 
          href={busSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-red-50 hover:bg-red-100 transition border border-red-100 group"
        >
          <span className="text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-110 transition">🚌</span>
          <span className="text-xs sm:text-sm font-bold text-red-700">Find Buses</span>
        </a>

        {/* train button */}
        <a 
          href={trainSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition border border-blue-100 group"
        >
          <span className="text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-110 transition">🚆</span>
          <span className="text-xs sm:text-sm font-bold text-blue-700">Check Trains</span>
          {nearestStation && <span className="text-[9px] sm:text-[10px] text-blue-400 mt-0.5">to {nearestStation}</span>}
        </a>

        {/* flight button */}
        <a 
          href={flightSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-sky-50 hover:bg-sky-100 transition border border-sky-100 group"
        >
          <span className="text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-110 transition">✈️</span>
          <span className="text-xs sm:text-sm font-bold text-sky-700">Flights</span>
        </a>

        {/* hotel button */}
        <a 
          href={hotelSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition border border-indigo-100 group"
        >
          <span className="text-xl sm:text-2xl mb-1 sm:mb-2 group-hover:scale-110 transition">🏨</span>
          <span className="text-xs sm:text-sm font-bold text-indigo-700">Hotels</span>
        </a>
      </div>
    </div>
  );
}