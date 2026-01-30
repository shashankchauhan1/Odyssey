'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';

export default function Dashboard() {
  const [trips, setTrips] = useState([]); // store the list of trips from the db
  const [loading, setLoading] = useState(true);

  // Search & Modal State
  const [searchQuery, setSearchQuery] = useState(''); // Stores what the user types ("Paris")
  const [showSetupModal, setShowSetupModal] = useState(false); // Controls the popup visibility
  const [isCreating, setIsCreating] = useState(false);

  // Form Data for the Trip
  const [tripDetails, setTripDetails] = useState({
    budget: 50000,
    travelers: 2,
    date: new Date().toISOString().split('T')[0],
  });

  const router = useRouter();
  const { user } = useUser();

  const canPlan = Boolean(user);

  const featureCards = useMemo(
    () => [
      {
        title: 'Logistics, simplified',
        desc: 'Nearest airport/train + last‑mile guidance, all in one view.',
        icon: '🧭',
      },
      {
        title: 'AI itinerary',
        desc: 'Generate a day-by-day plan based on pace and interests.',
        icon: '✨',
      },
      {
        title: 'Budget tracker',
        desc: 'Track spending live so you don’t overshoot your wallet.',
        icon: '💰',
      },
      {
        title: 'Map + exports',
        desc: 'Visualize the destination and export the plan to PDF.',
        icon: '🗺️',
      },
    ],
    []
  );

  // Fetch trips when logged in
  useEffect(() => {
    // if the user is logged in then show the trips
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

    // if the user is not logged in then there is nothing to show
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    fetchTrips();
  }, [user]);

  // delete the trip 
  const handleDeleteTrip = async (e, tripId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (res.ok) setTrips(trips.filter((t) => t._id !== tripId));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  // if plan button of trip is created then it do a security check whether the user is logged in or not is yes then show the model of budget otherwise no need to plan a trip first login
  const handleInitialSearch = (e) => {
    e.preventDefault();
    if (!canPlan) return;
    if (!searchQuery.trim()) return;
    setShowSetupModal(true);
  };

  // the final building of project
  const handleFinalCreate = async () => {
    setIsCreating(true);  // disable the button so user can't double click and start building 
    try {
      // fetch the trips
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationName: searchQuery,
          startDate: tripDetails.date,
          travelers: tripDetails.travelers,
          budget: tripDetails.budget,
        }),
      });

      // if there is a success message then redirect to a new page having the info otherwise failed due to some network error
      
      const json = await res.json();
      if (json.success) {
        router.push(`/trip/${json.data._id}`);
      } else {
        alert('Error: ' + json.error);
        setIsCreating(false);
      }
    } catch (err) {
      alert('Failed to start trip.');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* The top page */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-950 to-slate-900 text-white">
  
  {/* FIX: Reduced size on mobile (h-64 w-64) -> Full size on laptop (sm:h-[520px]) */}
  <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl sm:-left-40 sm:-top-40 sm:h-[520px] sm:w-[520px]" />
  
  {/* FIX: Reduced size on mobile (h-64 w-64) -> Full size on laptop (sm:h-[520px]) */}
  <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl sm:-right-40 sm:-top-32 sm:h-[520px] sm:w-[520px]" />

  <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20 text-center">
    <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white/90">
      <SignedIn>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </SignedIn>
      <SignedOut>
        <span className="h-2 w-2 rounded-full bg-red-400" />
      </SignedOut>
      Plan faster. Travel smarter.
    </p>

    <h1 className="text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
      Where to next?
    </h1>
    <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm text-white/80 sm:text-base px-4 sm:px-0">
      Odyssey helps you build an itinerary, understand logistics, track spending, and export everything to PDF.
    </p>

    {/* Search Section */}
    <div className="mx-auto mt-10 max-w-2xl px-4 sm:px-0">
      <SignedIn>
        <form onSubmit={handleInitialSearch} className="relative">
          <input
            type="text"
            placeholder="Try: Kyoto, Paris, Goa…"
            className="w-full rounded-full bg-white px-4 sm:px-5 py-3 sm:py-4 pr-24 sm:pr-28 text-sm sm:text-base text-slate-900 shadow-lg outline-none ring-1 ring-white/15 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-2 rounded-full bg-indigo-600 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition"
          >
            <span className="hidden sm:inline">Plan ➔</span>
            <span className="sm:hidden">Plan</span>
          </button>
        </form>
        <p className="mt-3 text-xs text-white/70 px-4 sm:px-0">
          We'll ask for date, travelers, and budget before creating the trip.
        </p>
      </SignedIn>

      <SignedOut>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
          <p className="text-sm font-semibold">Sign in to start planning</p>
          <p className="mt-1 text-sm text-white/75">
            Create trips, generate itineraries, and track expenses.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SignInButton mode="modal">
              <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50 transition">
                Sign In
              </button>
            </SignInButton>
            <Link href="/logistics" className="text-sm font-semibold text-white/80 hover:text-white transition">
              See what Odyssey covers →
            </Link>
          </div>
        </div>
      </SignedOut>
    </div>
  </div>
</div>

      {/* CONTENT */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="text-2xl">{f.icon}</div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                  Included
                </span>
              </div>
              <h3 className="mt-4 text-base font-extrabold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Trips */}
        <div className="mt-12 sm:mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Your Adventures</h2>
              <p className="mt-1 text-sm text-slate-600">Everything you planned, in one place.</p>
            </div>

            <SignedIn>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSetupModal(true);
                }}
                className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
              >
                + New Trip
              </button>
            </SignedIn>
          </div>

          {loading ? (
            <div className="mt-8 text-center text-slate-400">Loading…</div>
          ) : trips.length > 0 ? (
            <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <Link href={`/trip/${trip._id}`} key={trip._id} className="group relative block">
                  <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition group-hover:shadow-lg">
                    <button
                      onClick={(e) => handleDeleteTrip(e, trip._id)}
                      className="absolute right-2 sm:right-4 top-2 sm:top-4 rounded-full p-1.5 sm:p-2 text-slate-300 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete Trip"
                    >
                      🗑️
                    </button>

                    <div className="flex items-center justify-between gap-2 sm:gap-3 pr-8 sm:pr-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                          {trip.destination?.name ?? 'Unknown'}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">
                          {new Date(trip.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="hidden sm:block rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shrink-0">
                        Open →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm text-slate-600">No trips yet.</p>
              <SignedIn>
                <p className="mt-2 text-xs text-slate-500">Create your first trip from the search above.</p>
              </SignedIn>
              <SignedOut>
                <p className="mt-2 text-xs text-slate-500">Sign in to create and save trips.</p>
              </SignedOut>
            </div>
          )}
        </div>
      </div>

      {/* Setup modal (only meaningful when signed in) */}
      {showSetupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Trip setup</h2>
            <p className="mt-1 text-sm text-slate-600">
              {searchQuery ? (
                <>
                  Planning a trip to <span className="font-bold text-slate-900">{searchQuery}</span>.
                </>
              ) : (
                'Pick a destination from the search bar above.'
              )}
            </p>

            {!canPlan ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Sign in required</p>
                <p className="mt-1 text-sm text-slate-600">We need an account to save your trips.</p>
                <div className="mt-4 flex gap-3">
                  <SignInButton mode="modal">
                    <button className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition">
                      Sign In
                    </button>
                  </SignInButton>
                  <button
                    onClick={() => setShowSetupModal(false)}
                    className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Total Budget 
                    </label>
                    <input
                      type="number"
                      value={tripDetails.budget}
                      onChange={(e) => setTripDetails({ ...tripDetails, budget: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-lg font-mono text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Travelers
                    </label>
                    <input
                      type="number"
                      value={tripDetails.travelers}
                      onChange={(e) => setTripDetails({ ...tripDetails, travelers: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={tripDetails.date}
                      onChange={(e) => setTripDetails({ ...tripDetails, date: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setShowSetupModal(false)}
                    className="flex-1 rounded-xl bg-white py-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalCreate}
                    disabled={isCreating || !searchQuery.trim()}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
                  >
                    {isCreating ? 'Creating…' : 'Start Planning'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
