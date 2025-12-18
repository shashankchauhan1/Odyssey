'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900">My Trips</h1>
            <p className="text-slate-500 mt-2">Your travel history and upcoming plans.</p>
          </div>
          <Link href="/" className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition">
            + Plan New Trip
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <h3 className="text-xl font-bold text-gray-400 mb-2">No trips found</h3>
            <Link href="/" className="text-blue-600 hover:underline">Start your first adventure</Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {trips.map((trip) => {
              // Calculate status based on dates
              const isPast = new Date(trip.startDate) < new Date();
              const dateString = new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <Link href={`/trip/${trip._id}`} key={trip._id} className="block group relative">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group-hover:shadow-md transition">
                    
                    <div className="flex items-center gap-6">
                      {/* Date Box */}
                      <div className={`p-4 rounded-lg text-center min-w-[80px] ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>
                        <span className="block text-xl font-bold">{new Date(trip.startDate).getDate()}</span>
                        <span className="text-xs uppercase font-bold">{new Date(trip.startDate).toLocaleString('default', { month: 'short' })}</span>
                      </div>

                      {/* Info */}
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition">
                          Trip to {trip.destination?.name || "Unknown"}
                        </h2>
                        <div className="flex gap-4 mt-1 text-sm text-gray-500">
                          <span>📅 {dateString}</span>
                          <span>👥 {trip.travelers} Travelers</span>
                          <span>💰 ₹{trip.total_actual_cost} Spent</span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-4">
                      {/* Delete Button (Trash Icon) */}
                      <button 
                        onClick={(e) => handleDeleteTrip(e, trip._id)}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition z-10"
                        title="Delete Trip"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>

                      {/* Arrow Icon */}
                      <div className="text-gray-300 group-hover:translate-x-1 transition transform">
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