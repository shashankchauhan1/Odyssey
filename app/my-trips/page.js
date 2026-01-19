'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyTrips() {
  const [trips, setTrips] = useState([]); // to store the trips of a user
  const [loading, setLoading] = useState(true);

  // fetch the trips mapped to that user
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch('/api/trips');
        const json = await res.json();
        if (json.success) setTrips(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  if (loading) return <div className="p-20 text-center text-gray-400">Loading your history...</div>;

  const handleDeleteTrip = async (e, tripId) => {
    e.preventDefault(); // Stop the Link from opening
    e.stopPropagation(); // Stop the click from bubbling up

    if (!confirm("Are you sure you want to delete this trip permanently?")) return;

    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      
      if (json.success) {
        // Remove the trip from the screen immediately
        setTrips(trips.filter((t) => t._id !== tripId));
      } else {
        alert(json.error);
      }
    } catch (err) {
      alert("Failed to delete trip");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">My Trips</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">Your travel history and upcoming plans.</p>
          </div>
          <Link href="/" className="w-full sm:w-auto bg-slate-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm hover:bg-slate-800 transition text-center">
            + Plan New Trip
          </Link>
        </div>

        {/* if the length is zero means there is no trip right now */}
        {trips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <h3 className="text-xl font-bold text-gray-400 mb-2">No trips found</h3>
            <Link href="/" className="text-blue-600 hover:underline">Start your first adventure</Link>
          </div>
        ) : (
          // otherwise show the trips
          <div className="grid gap-6">
            {trips.map((trip) => {
              // Calculate status based on dates and show in descending order
              const isPast = new Date(trip.startDate) < new Date();
              const dateString = new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <Link href={`/trip/${trip._id}`} key={trip._id} className="block group relative">
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group-hover:shadow-md transition">
                    
                    <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                      {/* Date Box */}
                      <div className={`p-3 sm:p-4 rounded-lg text-center min-w-[70px] sm:min-w-[80px] shrink-0 ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>
                        <span className="block text-lg sm:text-xl font-bold">{new Date(trip.startDate).getDate()}</span>
                        <span className="text-[10px] sm:text-xs uppercase font-bold">{new Date(trip.startDate).toLocaleString('default', { month: 'short' })}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-blue-600 transition truncate">
                          Trip to {trip.destination?.name || "Unknown"}
                        </h2>
                        <div className="flex flex-wrap gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-500">
                          <span>📅 {dateString}</span>
                          <span>👥 {trip.travelers} Travelers</span>
                          <span>💰 ₹{trip.total_actual_cost} Spent</span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center justify-end sm:justify-start gap-3 sm:gap-4 shrink-0">
                      {/* Delete Button (Trash Icon) */}
                      <button 
                        onClick={(e) => handleDeleteTrip(e, trip._id)}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition z-10"
                        title="Delete Trip"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>

                      {/* Arrow Icon */}
                      <div className="hidden sm:block text-gray-300 group-hover:translate-x-1 transition transform">
                        ➔
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}