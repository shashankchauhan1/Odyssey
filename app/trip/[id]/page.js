'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import WeatherWidget from '@/components/WeatherWidget';
import BookingCard from '@/components/BookingCard';
import ExpenseTracker from '@/components/ExpenseTracker'; // <--- IMPORT THIS
import DownloadPdfBtn from '@/components/DownloadPdfBtn';
import EventsCard from '@/components/EventsCard';

// Load the map ONLY on the client side
const TripMap = dynamic(() => import('@/components/TripMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 rounded-xl animate-pulse"></div>
});

export default function TripPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- STATE FOR AI MODAL ---
  const [showGenModal, setShowGenModal] = useState(false);
  const [genOptions, setGenOptions] = useState({
    days: 3,
    pace: 'Moderate',
    interests: []
  });

  const interestOptions = ["Nature", "Food", "Shopping", "History", "Adventure"];

  useEffect(() => {
    if (!id) return;
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/trips/${id}`);
        const json = await res.json();
        if (json.success) setTrip(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]);


  // --- HANDLERS FOR AI GENERATION ---
  const submitGeneration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowGenModal(false);

    try {
      const res = await fetch('/api/trips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip._id,
          days: genOptions.days,
          pace: genOptions.pace,
          interests: genOptions.interests
        })
      });
      const json = await res.json();
      if (json.success) {
        setTrip(json.data);
      }
    } catch (err) {
      alert("Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setGenOptions(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading your Adventure...</div>;
  if (!trip) return <div className="p-20 text-center">Trip not found.</div>;

  const daysLeft = Math.ceil((new Date(trip.startDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative">

      {/* --- AI MODAL --- */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-6 text-center">
              <span className="text-4xl">✨</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">Design Your Day</h2>
              <p className="text-gray-500 text-sm">Tell the AI what kind of trip you want.</p>
            </div>

            <form onSubmit={submitGeneration} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">How many days?</label>
                <input
                  type="number" min="1" max="10"
                  value={genOptions.days}
                  onChange={e => setGenOptions({ ...genOptions, days: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl font-bold text-lg text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Pace</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Relaxed', 'Moderate', 'Packed'].map(p => (
                    <button
                      key={p} type="button"
                      onClick={() => setGenOptions({ ...genOptions, pace: p })}
                      className={`py-2 px-4 rounded-lg text-sm font-bold border transition ${genOptions.pace === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map(tag => (
                    <button
                      key={tag} type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`py-1 px-3 rounded-full text-xs font-bold border transition ${genOptions.interests.includes(tag) ? 'bg-slate-800 text-white' : 'bg-white text-gray-500'}`}
                    >
                      {genOptions.interests.includes(tag) ? '✓ ' + tag : tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowGenModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-gray-50 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">Generate Plan ➔</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">

        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 mb-2 block">← Back to Home</Link>

            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
              Trip to {trip.destination.name}
            </h1>

            <div className="flex items-center gap-4 text-slate-500 mb-4">
              <span>Starts {new Date(trip.startDate).toDateString()}</span>
              <span>•</span>
              <span>{trip.travelers} Travelers</span>
            </div>

            {/* NEW PDF BUTTON */}
            <DownloadPdfBtn trip={trip} />

          </div>

          <div className="text-center bg-blue-100 p-4 rounded-xl">
            <span className="block text-3xl font-bold text-blue-800">{daysLeft}</span>
            <span className="text-xs font-bold text-blue-600 uppercase">Days To Go</span>
          </div>
        </div>

        {/* WEATHER */}
        <WeatherWidget city={trip.destination.name} />
        
        {/* NEW: LIVE EVENTS CARD */}
        <EventsCard destinationName={trip.destination.name} />

        {/* LOGISTICS & INTEL SECTION */}
        {trip.destination && (
          <div className="space-y-6 mb-8">
            
            {/* 1. THE VIBE & HISTORY CARD (New!) */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-6">
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">About {trip.destination.name}</h2>
                 <p className="text-slate-600 leading-relaxed italic">"{trip.destination.vibe}"</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                   <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">🏰 History & Culture</h3>
                   <p className="text-sm text-slate-600 leading-relaxed">{trip.destination.history || trip.destination.description}</p>
                </div>
                <div>
                   <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">🗓️ Best Time to Visit</h3>
                   <p className="text-sm text-slate-600">{trip.destination.best_time || "All year round"}</p>
                </div>
              </div>
            </div>

            {/* 2. LOGISTICS CARD (Updated with Airport) */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">✈️ How to Reach</h3>
                <div className="space-y-4">
                   {/* AIRPORT */}
                   {trip.destination.accessibility?.nearest_airport && (
                     <div className="flex items-start gap-3">
                       <span className="text-xl">🛫</span>
                       <div>
                         <p className="font-bold text-slate-800">Nearest Airport</p>
                         <p className="text-sm text-gray-600">
                           {trip.destination.accessibility.nearest_airport.name} 
                           <span className="text-xs ml-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                             {trip.destination.accessibility.nearest_airport.distance_km}km away
                           </span>
                         </p>
                       </div>
                     </div>
                   )}
                   
                   {/* TRAIN */}
                   {trip.destination.accessibility?.nearest_railway && (
                     <div className="flex items-start gap-3">
                       <span className="text-xl">🚆</span>
                       <div>
                         <p className="font-bold text-slate-800">Nearest Train</p>
                         <p className="text-sm text-gray-600">{trip.destination.accessibility.nearest_railway.name} ({trip.destination.accessibility.nearest_railway.distance_km}km)</p>
                       </div>
                     </div>
                   )}
                </div>
              </div>

              {/* LOCAL RULES */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">💡 Insider Tips</h3>
                <ul className="space-y-3">
                  {trip.destination.local_rules?.map((rule, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 font-bold">•</span>
                      <span><strong className="text-slate-900">{rule.title}:</strong> {rule.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING LINKS */}
        <BookingCard
          destinationName={trip.destination.name}
          nearestStation={trip.destination.accessibility?.nearest_railway?.name}
        />

        {/* --- EXPENSE TRACKER (Replaces old Budget Card) --- */}
        <ExpenseTracker
          tripId={trip._id}
          budget={trip.budget_limit}
          expenses={trip.expenses}
          onExpenseUpdate={(newExpenses) => {
            // 1. Update the expenses list
            // 2. Also update the 'total_actual_cost' so the budget bar moves instantly
            const newTotal = newExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
            setTrip(prev => ({
              ...prev,
              expenses: newExpenses,
              total_actual_cost: newTotal
            }));
          }}
        />
        {/* -------------------------------------------------- */}


        {/* ITINERARY & MAP SECTION */}
        <div className="mt-12">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Trip Map</h3>
            <TripMap destinationName={trip.destination.name} />
          </div>

          {trip.itinerary && trip.itinerary.length > 0 ? (
            <div className="space-y-8">
              {trip.itinerary.map((dayItem) => (
                <div key={dayItem.day} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Day {dayItem.day}</h2>
                  <div className="space-y-4">
                    {dayItem.events.map((event, idx) => (
                      <div key={idx} className="flex gap-4 items-start p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-bold text-gray-500 w-16 pt-1">{event.startTime}</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{event.title}</h4>
                          <span className="text-xs text-slate-500 bg-white border px-2 py-1 rounded mt-1 inline-block">{event.type}</span>
                        </div>
                        <div className="text-right text-sm font-medium text-slate-600">₹{event.cost}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
              <h3 className="text-xl font-bold text-gray-400 mb-2">Itinerary Empty</h3>
              <p className="text-gray-400 mb-6">Ask the AI to generate your day-by-day plan.</p>
              <button onClick={() => setShowGenModal(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
                ✨ Generate Itinerary with AI
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}