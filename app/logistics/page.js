// This page tells about what our platform provides

export const metadata = {
  title: 'Logistics • Odyssey',
  description: 'A practical overview of travel logistics Odyssey helps you plan.',
};

export default function LogisticsPage() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-700">
            🧭 Logistics
          </p>
          <h1 className="text-balance text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900">
            Everything you need to get there (and move around).
          </h1>
          <p className="mt-4 max-w-3xl text-pretty text-sm sm:text-base text-slate-600">
            A good itinerary is useless if the basics aren't clear. This page explains what Odyssey aims to
            surface for each destination and trip.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-14">
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">How to reach</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Nearest airport and railway station, plus approximate distance.
            </p>
            <ul className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm text-slate-700">
              <li>✈️ Nearest airport + distance</li>
              <li>🚆 Nearest rail hub + distance</li>
              <li>🚖 Last-mile mode + typical cost</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">On-ground essentials</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Quick facts to reduce friction after landing.
            </p>
            <ul className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm text-slate-700">
              <li>💬 Language + common phrases (when available)</li>
              <li>💱 Currency + payment tips</li>
              <li>📶 Connectivity (SIM/Wi‑Fi) guidance</li>
              <li>🔌 Power plug basics (when available)</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Safety + rules</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Practical cautions and local norms so you don't get surprised.
            </p>
            <ul className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm text-slate-700">
              <li>⚠️ Scams / warnings</li>
              <li>🪪 Permits / entry rules (when applicable)</li>
              <li>☎️ Emergency notes (when available)</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-6 lg:p-8">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Tip</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-700">
            The more specific your destination name is (e.g. "Kyoto, Japan" instead of "Kyoto"), the more
            accurate the logistics details tend to be.
          </p>
        </div>
      </div>
    </div>
  );
}
