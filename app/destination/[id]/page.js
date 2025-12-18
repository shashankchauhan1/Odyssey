'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DestinationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [dest, setDest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- NEW STATE FOR MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    travelers: 1,
    budget: 10000
  });
  // ---------------------------

  useEffect(() => {
    if (!id) return;
    const fetchDest = async () => {
      try {
        const res = await fetch(`/api/destinations/${id}`);
        const json = await res.json();
        if (json.success) setDest(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDest();
  }, [id]);

  // --- NEW HANDLER: Submit the Modal Form ---
  const handleCreateTrip = async (e) => {
    e.preventDefault(); // Stop page reload
    
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationId: dest._id,
          startDate: formData.startDate,
          travelers: formData.travelers, // Now using user input!
          budget: formData.budget        // Now using user input!
        })
      });

      const json = await res.json();
      
      if (json.success) {
        router.push(`/trip/${json.data._id}`);
      } else {
        alert("Error: " + json.error);
      }
    } catch (err) {
      alert("Failed to create trip");
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading Logistics...</div>;
  if (!dest) return <div className="p-20 text-center">Destination not found.</div>;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-white relative">
      
      {/* --- THE MODAL (POPUP) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Plan Your Trip to {dest.name}</h2>
            
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">When are you going?</label>
                <input 
                  type="date" 
                  required
                  min={today} // <--- THIS BLOCKS PAST DATES
                  className="w-full p-3 border border-gray-300 rounded-lg text-black"
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Travelers</label>
                  <input 
                    type="number" 
                    min="1" 
                    defaultValue="1"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    onChange={(e) => setFormData({...formData, travelers: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Budget (₹)</label>
                  <input 
                    type="number" 
                    min="1000" 
                    defaultValue="10000"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-slate-600 font-bold hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800"
                >
                  Create Trip ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ------------------------- */}

      {/* 1. Hero Section */}
      <div className="bg-slate-900 text-white py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-sm text-gray-400 hover:text-white mb-4 block">← Back to Dashboard</Link>
          <h1 className="text-5xl font-extrabold mb-4">{dest.name}</h1>
          <p className="text-xl text-gray-300 max-w-2xl">{dest.description}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* 2. Main Column: The Logistics Timeline */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Suggested Logistics Flow</h2>
          <div className="border-l-2 border-blue-200 pl-8 space-y-10 relative">
            
            {/* Step 1 */}
            <div className="relative">
              <span className="absolute -left-[41px] bg-blue-500 w-5 h-5 rounded-full border-4 border-white"></span>
              <h3 className="font-bold text-lg">Reach Nearest Hub</h3>
              <div className="bg-gray-50 p-4 rounded-lg mt-2 border border-gray-100">
                <p className="font-semibold text-slate-700">🚆 {dest.accessibility.nearest_railway.name}</p>
                <p className="text-sm text-gray-500">Distance: {dest.accessibility.nearest_railway.distance_km} km</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <span className="absolute -left-[41px] bg-blue-500 w-5 h-5 rounded-full border-4 border-white"></span>
              <h3 className="font-bold text-lg">Last Mile Connect</h3>
              <div className="bg-blue-50 p-4 rounded-lg mt-2 border border-blue-100">
                <p className="font-semibold text-blue-800">🚖 Take {dest.accessibility.last_mile_connectivity.mode}</p>
                <p className="text-sm text-blue-600">Est Cost: ₹{dest.accessibility.last_mile_connectivity.avg_cost}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <span className="absolute -left-[41px] bg-red-500 w-5 h-5 rounded-full border-4 border-white"></span>
              <h3 className="font-bold text-lg text-red-600">⚠️ Critical Checks</h3>
              <div className="space-y-3 mt-2">
                {dest.local_rules.map((rule, idx) => (
                   <div key={idx} className="bg-red-50 p-3 rounded border border-red-100 text-sm text-red-800">
                     <strong>{rule.title}:</strong> {rule.description}
                   </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 3. Sidebar */}
        <div>
           <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
              <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-4">Must Visit</h3>
              <ul className="space-y-3">
                {dest.attractions.map(attr => (
                  <li key={attr.name} className="flex justify-between items-center text-sm">
                    <span>{attr.name}</span>
                    <span className="text-xs bg-white border px-2 py-1 rounded text-gray-500">{attr.type}</span>
                  </li>
                ))}
              </ul>
           </div>
           
           {/* --- UPDATE: BUTTON NOW OPENS MODAL --- */}
           <button 
             onClick={() => setShowModal(true)} // Opens the popup!
             className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
           >
             Start Planning Trip ➔
           </button>
        </div>

      </div>
    </div>
  );
}