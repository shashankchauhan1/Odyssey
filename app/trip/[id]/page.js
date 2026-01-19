'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import WeatherWidget from '@/components/WeatherWidget';
import BookingCard from '@/components/BookingCard';
import DownloadPdfBtn from '@/components/DownloadPdfBtn';
import EventsCard from '@/components/EventsCard';
import ExpenseDashboard from '@/components/ExpenseDashboard';
import ShareTripModal from '@/components/ShareTripModal';
import SafetyWidget from '@/components/SafetyWidget';
import VideoGallery from '@/components/VideoGallery';
import LanguageCard from '@/components/LanguageCard';

// Load the map ONLY on the client side
const TripMap = dynamic(() => import('@/components/TripMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 rounded-xl animate-pulse"></div>
});

export default function TripPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentAttempted, setEnrichmentAttempted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // --- state for ai -> the card for info ---
  const [showGenModal, setShowGenModal] = useState(false);
  const [genOptions, setGenOptions] = useState({
    days: 3,
    pace: 'Moderate',
    interests: []
  });

  const interestOptions = ["Nature", "Food", "Shopping", "History", "Adventure"];

  const fetchTrip = useCallback(async () => {
    if (!id) return;

    try {
      const res = await fetch(`/api/trips/${id}`);
      const json = await res.json();
      if (json.success) setTrip(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Auto-enrich old/sparse destination profiles so logistics cards don't stay blank
  useEffect(() => {
    if (!trip || enrichmentAttempted) return;

    // fetch the crucial data (currency, language, airport etc. then)
    const dest = trip?.destination || {};
    const needsEnrichment =
      !dest?.currency ||
      !dest?.language ||
      !dest?.connectivity?.sim ||
      !dest?.accessibility?.nearest_airport ||
      !(Array.isArray(dest?.local_rules) && dest.local_rules.length > 0);

    if (!needsEnrichment || !dest?._id) return;

    setEnrichmentAttempted(true);
    setEnriching(true);
    // silently calls Ai to get that meathod
    fetch(`/api/destinations/${dest._id}/enrich`, { method: 'POST' })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) {
          setLoading(true);
          return fetchTrip();
        }
      })
      .catch(console.error)
      .finally(() => setEnriching(false));
  }, [trip, enrichmentAttempted, fetchTrip]);


  // --- handler for ai generation ---
  const submitGeneration = async (e) => {
    e.preventDefault(); // stop loading page
    setLoading(true); // stop loading spinner
    setShowGenModal(false); // close the popup

    try {
      // send user preference to backend
      const res = await fetch('/api/trips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip._id,
          days: genOptions.days,  // relaxed
          pace: genOptions.pace,    // moderate
          interests: genOptions.interests // ["adventure"]
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
      // Check: Is this interest already in the list? [adventure,food,etc.] then remove it otherwise add it
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-gray-400">
        {enriching ? 'Enriching destination details…' : 'Loading your Adventure...'}
      </div>
    );
  }
  if (!trip) return <div className="p-20 text-center">Trip not found.</div>;

  // the day calculator
  // it subtracts "Today" from "Start Date" -> if +ve then 5 days to go if -ve 2 days since start
  const diffDays = Math.ceil((new Date(trip.startDate) - new Date()) / (1000 * 60 * 60 * 24));
  const daysValue = Math.abs(diffDays);
  const daysLabel = diffDays >= 0 ? 'Days To Go' : 'Days Since Start';

  const destination = trip?.destination || {};
  const accessibility = destination?.accessibility && typeof destination.accessibility === 'object' ? destination.accessibility : {};
  const localRulesRaw = Array.isArray(destination?.local_rules) ? destination.local_rules : [];
  const localRules = localRulesRaw.filter((r) => r && (r.title || r.description));
  const itinerary = Array.isArray(trip?.itinerary) ? trip.itinerary : [];

  const connectivity = destination?.connectivity && typeof destination.connectivity === 'object' ? destination.connectivity : {};
  const emergency = destination?.emergency && typeof destination.emergency === 'object' ? destination.emergency : {};

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 relative">

      {/* --- AI MODAL --- */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 text-center">
              <span className="text-3xl sm:text-4xl">✨</span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">Design Your Day</h2>
              <p className="text-gray-500 text-xs sm:text-sm">Tell the AI what kind of trip you want.</p>
            </div>

            <form onSubmit={submitGeneration} className="space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">How many days?</label>
                <input
                  type="number" min="1" max="10"
                  value={genOptions.days}
                  onChange={e => setGenOptions({ ...genOptions, days: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl font-bold text-base sm:text-lg text-black"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Select Pace</label>
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
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Interests</label>
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex-1 min-w-0">
            <Link href="/" className="text-xs sm:text-sm text-slate-500 hover:text-indigo-600 mb-2 block">← Back to Home</Link>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-2 break-words">
              Trip to {trip.destination.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 mb-4">
              <span>Starts {new Date(trip.startDate).toDateString()}</span>
              <span className="hidden sm:inline">•</span>
              <span>{trip.travelers} Travelers</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition"
              >
                Share
              </button>
              <DownloadPdfBtn trip={trip} />
            </div>

          </div>

          <div className="text-center bg-indigo-50 p-3 sm:p-4 rounded-2xl border border-indigo-100 shrink-0 self-start sm:self-auto">
            <span className="block text-2xl sm:text-3xl font-extrabold text-indigo-700">{daysValue}</span>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-indigo-600 uppercase tracking-wide">{daysLabel}</span>
          </div>
        </div>

        {/* weather */}
        <WeatherWidget city={trip.destination.name} />

        {/* live events card */}
        {/* COLLABORATORS */}
        <div className="mt-6 mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Collaborators</h3>
              <p className="text-xs text-slate-500">Owner + invited editors</p>
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Share
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs sm:text-sm">
              <span className="font-semibold text-slate-800">Owner</span>
              <span className="text-slate-600 break-all">
                {trip.owner_display_name || trip.owner_email || trip.userId}
              </span>
            </div>
            {(trip.collaborators || []).length === 0 && (
              <p className="text-xs text-slate-500">No collaborators yet.</p>
            )}
            {(trip.collaborators || []).map((c, idx) => (
              <div
                key={`${c.email || c.userId || idx}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs sm:text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {c.display_name || c.email || c.userId || 'Collaborator'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {c.email || c.userId ? (c.email || `User ID: ${c.userId}`) : 'Pending signup'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase">{c.role || 'editor'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* NEW: LIVE EVENTS CARD */}
        <EventsCard destinationName={trip.destination.name} />

        {/* quick essentials  */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mb-6 sm:mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2">💱 Money</div>
            <div className="text-sm font-semibold text-slate-900">
              {destination.currency || 'Local currency varies — carry some cash, plus a card/UPI backup where supported.'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2">💬 Language</div>
            <div className="text-sm font-semibold text-slate-900">
              {destination.language || 'Local language varies — English is commonly understood in tourist areas.'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2">📶 Connectivity</div>
            <div className="text-sm text-slate-700">
              <div>
                <span className="font-bold text-slate-900">SIM:</span>{' '}
                {connectivity.sim || 'Get a local SIM/eSIM when possible and download offline maps before you arrive.'}
              </div>
              <div className="mt-1">
                <span className="font-bold text-slate-900">Wi‑Fi:</span>{' '}
                {connectivity.wifi || 'Wi‑Fi is common in hotels/cafes; confirm reliability if you need to work.'}
              </div>
            </div>
          </div>
        </div>

        <LanguageCard phrases={destination.essential_phrases || []} />

        {emergency.note && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="text-xs font-extrabold uppercase tracking-wide text-amber-700">☎️ Emergency note</div>
            <p className="mt-2 text-sm text-amber-900">{emergency.note}</p>
          </div>
        )}

        {/* logistics, etc */}
        {trip.destination && (
          <div className="space-y-6 mb-8">

            {/* vibe and history card */}
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">About {trip.destination.name}</h2>
                {trip.destination.vibe ? (
                  <p className="text-slate-600 leading-relaxed italic">“{trip.destination.vibe}”</p>
                ) : (
                  <p className="text-slate-600 leading-relaxed">A quick intro will appear here as the destination profile fills in.</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
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

            {/* logistic card */}
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">✈️ How to Reach</h3>
                <div className="space-y-4">
                  {/* airport */}
                  {accessibility?.nearest_airport && (
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🛫</span>
                      <div>
                        <p className="font-bold text-slate-800">Nearest Airport</p>
                        <p className="text-sm text-gray-600">
                          {accessibility.nearest_airport.name}
                          {accessibility.nearest_airport.distance_km != null && (
                            <span className="text-xs ml-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {accessibility.nearest_airport.distance_km}km away
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Train */}
                  {accessibility?.nearest_railway && (
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🚆</span>
                      <div>
                        <p className="font-bold text-slate-800">Nearest Train</p>
                        <p className="text-sm text-gray-600">
                          {accessibility.nearest_railway.name}
                          {accessibility.nearest_railway.distance_km != null && (
                            <span className="text-xs text-slate-500"> ({accessibility.nearest_railway.distance_km}km)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {!accessibility?.nearest_airport && !accessibility?.nearest_railway && (
                    <p className="text-sm text-slate-500">
                      Transport details aren’t available yet — Odyssey will auto-enrich this destination when possible.
                    </p>
                  )}
                </div>
              </div>

              {/* local rules */}
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">💡 Insider Tips</h3>
                <ul className="space-y-3">
                  {localRules.length > 0 ? (
                    localRules.map((rule, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-700">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>
                          <strong className="text-slate-900">{rule.title}:</strong> {rule.description}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No tips yet. Generate/recreate the destination profile for richer details.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <SafetyWidget
          tripId={trip._id}
          alerts={trip.safety_alerts || []}
          onAlertsUpdate={(alerts) => setTrip((prev) => ({ ...prev, safety_alerts: alerts }))}
        />

        <VideoGallery videoIds={destination.video_ids || []} />

        {/* BOOKING LINKS */}
        <BookingCard
          destinationName={trip.destination.name}
          nearestStation={accessibility?.nearest_railway?.name}
        />



        {/* itinerary & map section */}
        <div className="mt-8 sm:mt-12">
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">Trip Map</h3>
            <TripMap destinationName={trip.destination.name} />
          </div>

          {itinerary.length > 0 ? (
            <div className="space-y-8">
              {itinerary.map((dayItem) => {
                const events = Array.isArray(dayItem?.events) ? dayItem.events : [];

                return (
                  <div key={dayItem.day} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Day {dayItem.day}</h2>
                      {dayItem.theme && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {dayItem.theme}
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {events.map((event, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-xs sm:text-sm font-extrabold text-slate-500 w-full sm:w-16 pt-1">
                            {event.startTime || '—'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">{event.title}</h4>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {event.type && (
                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded">
                                  {event.type}
                                </span>
                              )}
                              {event.endTime && (
                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">until {event.endTime}</span>
                              )}
                            </div>
                            {event.description && (
                              <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-relaxed">{event.description}</p>
                            )}
                          </div>
                          <div className="text-left sm:text-right text-xs sm:text-sm font-extrabold text-slate-700 w-full sm:w-auto">
                            {event.cost != null ? `₹${Number(event.cost).toLocaleString()}` : '—'}
                          </div>
                        </div>
                      ))}

                      {events.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
                          No events for this day yet.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-dashed border-slate-300 text-center">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-400 mb-2">Itinerary empty</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-4 sm:mb-6">Ask the AI to generate your day-by-day plan.</p>
              <button
                onClick={() => setShowGenModal(true)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white text-sm sm:text-base font-extrabold rounded-xl hover:bg-indigo-500 transition"
              >
                ✨ Generate itinerary
              </button>
            </div>
          )}
        </div>

<div className="mt-8 sm:mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">💰 Budget & Expenses</h2>
        {trip && <ExpenseDashboard trip={trip} setTrip={setTrip} />}
      </div>

      </div>

      

      <ShareTripModal
        tripId={trip._id}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShared={(updatedTrip) => {
          if (updatedTrip?._id) {
            setTrip((prev) => ({ ...prev, ...updatedTrip }));
          }
        }}
      />

    </div>
  );
}