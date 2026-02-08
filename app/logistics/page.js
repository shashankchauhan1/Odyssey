// This page tells about what our platform provides

export const metadata = {
  title: 'Logistics • Odyssey',
  description: 'A practical overview of travel logistics Odyssey helps you plan.',
};

export default function LogisticsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-3 py-0.5 mb-4 shadow-sm">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Odyssey Essentials</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
            The Logistics Guide
          </h1>
          <p className="max-w-xl mx-auto text-base text-slate-500 font-medium">
            Practical details to help you get there and move around smoothly.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: Reach (Blue Theme) */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-2 hover:ring-blue-500 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold shadow-inner">
                ✈️
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Getting There</h2>
            </div>
            <p className="text-xs font-medium text-slate-400 mb-4 h-8">
              Distance and transport hubs.
            </p>
            <ul className="space-y-2">
              {[
                { icon: '📍', text: 'Nearest airport' },
                { icon: '🚆', text: 'Railway stations' },
                { icon: '🚖', text: 'Last-mile options' }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 group-hover:text-blue-700 transition-colors">
                  <span className="text-blue-400 opacity-60 text-xs">●</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-blue-500 text-xs">↗</span>
            </div>
          </div>

          {/* Card 2: Essentials (Emerald Theme) */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-2 hover:ring-emerald-500 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-inner">
                🌍
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">On-Ground</h2>
            </div>
            <p className="text-xs font-medium text-slate-400 mb-4 h-8">
              Local basics like currency & SIM.
            </p>
            <ul className="space-y-2">
              {[
                { icon: '💬', text: 'Local language' },
                { icon: '💱', text: 'Best currency methods' },
                { icon: '📶', text: 'SIM & Connectivity' }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 group-hover:text-emerald-700 transition-colors">
                  <span className="text-emerald-400 opacity-60 text-xs">●</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-emerald-500 text-xs">↗</span>
            </div>
          </div>

          {/* Card 3: Safety (Rose Theme) */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 hover:ring-2 hover:ring-rose-500 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold shadow-inner">
                🛡️
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Stay Safe</h2>
            </div>
            <p className="text-xs font-medium text-slate-400 mb-4 h-8">
              Important rules and emergency warnings.
            </p>
            <ul className="space-y-2">
              {[
                { icon: '⚠️', text: 'Scam alerts' },
                { icon: '🪪', text: 'Entry permits' },
                { icon: '☎️', text: 'Emergency contacts' }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 group-hover:text-rose-700 transition-colors">
                  <span className="text-rose-400 opacity-60 text-xs">●</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-rose-500 text-xs">↗</span>
            </div>
          </div>
        </div>

        {/* Pro Tip Banner */}
        <div className="mt-8 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-1 shadow-lg">
          <div className="flex items-center gap-4 rounded-[10px] bg-white/10 px-6 py-4 backdrop-blur-sm">
            <div className="shrink-0 w-8 h-8 rounded-full bg-white text-violet-600 flex items-center justify-center text-sm font-bold shadow-sm">
              💡
            </div>
            <div>
              <p className="text-xs font-bold text-white/60 text-indigo-100 uppercase tracking-widest mb-0.5">Pro Tip</p>
              <p className="text-sm font-bold text-white">
                Search for specific cities (e.g. "Kyoto, Japan") to get ultra-precise logistics data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
