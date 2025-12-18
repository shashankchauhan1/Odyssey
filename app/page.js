'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Modal State
  const [searchQuery, setSearchQuery] = useState("");
  const [showSetupModal, setShowSetupModal] = useState(false); // Controls the popup
  const [isCreating, setIsCreating] = useState(false);
  
  // Form Data for the Trip
  const [tripDetails, setTripDetails] = useState({
    budget: 50000,
    travelers: 2,
    date: new Date().toISOString().split('T')[0] // Default to today (YYYY-MM-DD)
  });

  const router = useRouter();
  const { user } = useUser();

  // 1. Fetch Trips on Load
  useEffect(() => {
    async function fetchTrips() {
      try {
        const res = await fetch('/api/trips');
        const json = await res.json();
        if (json.success) setTrips(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchTrips();
  }, [user]);

  // 2. Delete Trip Handler
  const handleDeleteTrip = async (e, tripId) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if(!confirm("Are you sure you want to delete this trip?")) return;

    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (res.ok) {
        setTrips(trips.filter(t => t._id !== tripId));
      }
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // 3. Handle "Go" Button (Opens Modal)
  const handleInitialSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSetupModal(true); // <--- STOP! Open the modal instead of creating immediately.
  };

  // 4. Handle "Start Planning" (Actual Creation)
  const handleFinalCreate = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/trips', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationName: searchQuery,
          startDate: tripDetails.date,
          travelers: tripDetails.travelers,
          budget: tripDetails.budget
        })
      });

      const json = await res.json();
      if (json.success) {
        router.push(`/trip/${json.data._id}`);
      } else {
        alert("Error: " + json.error);
        setIsCreating(false);
      }
    } catch (err) {
      alert("Failed to start trip.");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      
      {/* --- HERO SECTION --- */}
      <div className="bg-slate-900 text-white py-24 px-8 text-center">
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight">
          Where to next?
        </h1>
        
        {/* Search Bar */}
        <form onSubmit={handleInitialSearch} className="max-w-lg mx-auto relative">
          <input 
            type="text" 
            placeholder="e.g. Kyoto, Paris, Goa..." 
            className="w-full p-4 rounded-full text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500 text-white border-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="submit" 
            className="absolute right-2 top-2 bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition"
          >
            Go ➔
          </button>
        </form>
      </div>

      {/* --- MY TRIPS GRID --- */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Your Adventures</h2>
        
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : trips.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
             {trips.map(trip => (
               <Link href={`/trip/${trip._id}`} key={trip._id} className="block group relative">
                 <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition h-full flex flex-col justify-between bg-white">
                    <button 
                      onClick={(e) => handleDeleteTrip(e, trip._id)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition z-10 p-2"
                      title="Delete Trip"
                    >
                      🗑️
                    </button>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">{trip.destination.name}</h3>
                      <p className="text-sm text-gray-500">{new Date(trip.startDate).toLocaleDateString()}</p>
                    </div>
                 </div>
               </Link>
             ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
             <p className="text-gray-500 mb-4">You haven't planned any trips yet.</p>
          </div>
        )}
      </div>

      {/* --- SETUP MODAL (The New Part) --- */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Trip to {searchQuery} ✈️</h2>
            <p className="text-gray-500 mb-6 text-sm">Let's set some ground rules before we fly.</p>

            <div className="space-y-4">
              {/* Budget Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Budget (₹)</label>
                <input 
                  type="number" 
                  value={tripDetails.budget}
                  onChange={(e) => setTripDetails({...tripDetails, budget: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg text-black"
                />
              </div>

              {/* Travelers Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Travelers</label>
                <input 
                  type="number" 
                  value={tripDetails.travelers}
                  onChange={(e) => setTripDetails({...tripDetails, travelers: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={tripDetails.date}
                  onChange={(e) => setTripDetails({...tripDetails, date: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setShowSetupModal(false)}
                className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleFinalCreate}
                disabled={isCreating}
                className="flex-1 py-3 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Start Planning"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
