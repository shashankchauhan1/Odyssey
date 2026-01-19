'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export default function DestinationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [dest, setDest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentAttempted, setEnrichmentAttempted] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    travelers: 1,
    budget: 10000,
  });

  const fetchDest = useCallback(async () => {
    if (!id) return;

    // fetch the destination
    try {
      const res = await fetch(`/api/destinations/${id}`);
      const json = await res.json();
      if (json.success) setDest(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDest();
  }, [fetchDest]);

  // Auto-enrich old/sparse destination profiles
  useEffect(() => {
    if (!dest || enrichmentAttempted) return;

    const needsEnrichment =
      !dest?.currency ||
      !dest?.language ||
      !dest?.connectivity?.sim ||
      !(Array.isArray(dest?.local_rules) && dest.local_rules.length > 0);

    if (!needsEnrichment) return;

    setEnrichmentAttempted(true);
    setEnriching(true);

    // if quality needed then fetch the data 
    fetch(`/api/destinations/${id}/enrich`, { method: 'POST' })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setDest(json.data);
      })
      .catch(console.error)
      .finally(() => setEnriching(false));
  }, [dest, enrichmentAttempted, id]);

  // create trip
  const handleCreateTrip = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationName: dest?.name,
          startDate: formData.startDate,
          travelers: formData.travelers,
          budget: formData.budget,
        }),
      });

      const json = await res.json();

      if (json.success) {
        router.push(`/trip/${json.data._id}`);
      } else {
        alert('Error: ' + json.error);
      }
    } catch (err) {
      alert('Failed to create trip');
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-slate-400">
        {enriching ? 'Enriching destination details…' : 'Loading destination…'}
      </div>
    );
  }

  if (!dest) {
    return <div className="p-20 text-center">Destination not found.</div>;
  }

  const today = new Date().toISOString().split('T')[0];

  const accessibility = safeObject(dest.accessibility);
  const localRules = safeArray(dest.local_rules);
  const attractions = safeArray(dest.attractions);

  const nearestAirport = accessibility?.nearest_airport;
  const nearestRail = accessibility?.nearest_railway;
  const lastMile = accessibility?.last_mile_connectivity;

  const essentials = (() => {
    const rows = [];

    if (dest.best_time) rows.push({ label: 'Best time', value: dest.best_time, icon: '🗓️' });
    if (dest.language) rows.push({ label: 'Language', value: dest.language, icon: '💬' });
    if (dest.currency) rows.push({ label: 'Currency', value: dest.currency, icon: '💱' });
    if (dest.timezone) rows.push({ label: 'Timezone', value: dest.timezone, icon: '🕒' });

    if (rows.length === 0) {
      rows.push({
        label: 'Quick note',
        value: 'Logistics will appear here as the destination profile fills in.',
        icon: 'ℹ️',
      });
    }

    return rows;
  })();

  return (
    <div className="min-h-screen">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Plan your trip</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">Trip to {dest.name}</p>

            <form onSubmit={handleCreateTrip} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  When are you going?
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20"
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20"
                    onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    defaultValue="10000"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20"
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-white py-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-500 transition"
                >
                  Create Trip ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main section */}
      <div className="border-b border-slate-200 bg-gradient-to-b from-slate-950 to-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <Link href="/" className="text-xs sm:text-sm font-semibold text-white/70 hover:text-white">
            ← Back
          </Link>
          <h1 className="mt-4 text-balance text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {dest.name}
          </h1>
          <p className="mt-4 max-w-3xl text-pretty text-sm sm:text-base text-white/75">{dest.description}</p>
          {dest.vibe && <p className="mt-4 max-w-3xl italic text-sm sm:text-base text-white/70">"{dest.vibe}"</p>}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Essentials grid */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Travel essentials</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">Quick facts and the basics you need before you arrive.</p>

            <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 sm:grid-cols-2">
              {essentials.map((row) => (
                <div key={row.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">{row.icon}</div>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        {row.label}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{row.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* How to Reach */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-xl sm:text-2xl">✈️</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">How to Reach</h2>
                <p className="text-xs sm:text-sm text-slate-600">Your route to {dest.name}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              {/* Airport Card */}
              <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xl">🛫</span>
                  </div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-blue-700">By Air</div>
                </div>
                <div className="text-sm font-bold text-blue-900">
                  {nearestAirport?.name || 'Nearest airport details not available'}
                </div>
                {nearestAirport?.distance_km != null && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs font-bold text-blue-700 shadow-sm">
                    <span>📍</span> {nearestAirport.distance_km} km from city center
                  </div>
                )}
              </div>

              {/* Train Card */}
              <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xl">🚆</span>
                  </div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">By Train</div>
                </div>
                <div className="text-sm font-bold text-emerald-900">
                  {nearestRail?.name || 'Railway station information coming soon'}
                </div>
                {nearestRail?.distance_km != null && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs font-bold text-emerald-700 shadow-sm">
                    <span>📍</span> {nearestRail.distance_km} km away
                  </div>
                )}
              </div>
            </div>

            {/* Last Mile */}
            {lastMile && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚖</span>
                  <div className="flex-1">
                    <div className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Last Mile Transport</div>
                    <div className="text-sm font-bold text-amber-900 mt-1">
                      {lastMile?.mode || 'Taxi / local transport available'}
                      {lastMile?.avg_cost != null && (
                        <span className="ml-2 text-amber-700">(approx ₹{lastMile.avg_cost})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Insider Tips */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-xl sm:text-2xl">💡</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Insider Tips & Local Rules</h2>
                <p className="text-xs sm:text-sm text-slate-600">Important things to know before you go</p>
              </div>
            </div>

            {localRules.length > 0 ? (
              <div className="space-y-4">
                {localRules.map((rule, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50">
                    <div className="flex-shrink-0 w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-rose-900">{rule.title}</div>
                      <div className="text-sm text-rose-800 mt-1 leading-relaxed">{rule.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">ℹ️</span>
                </div>
                <p className="text-sm text-slate-600">No specific tips yet. Always check local advisories and weather before traveling.</p>
              </div>
            )}
          </div>

          {/* History / culture */}
          {(dest.history || dest.description) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">A little context</h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">{dest.history || dest.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-500">Must visit</h3>
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              {attractions.length > 0 ? (
                attractions.slice(0, 8).map((attr, idx) => (
                  <div key={attr?.name ?? idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">{attr?.name ?? 'Attraction'}</div>
                        {attr?.description && <div className="mt-1 text-sm text-slate-600">{attr.description}</div>}
                      </div>
                      {attr?.type && (
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
                          {attr.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">No attractions listed yet.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full rounded-2xl bg-slate-900 py-3 sm:py-4 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:bg-slate-800 transition"
          >
            Start planning this trip ➔
          </button>
        </div>
      </div>
    </div>
  );
}
