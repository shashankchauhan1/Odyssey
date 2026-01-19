'use client';

import { useState } from 'react';

export default function LanguageCard({ phrases = [] }) {
  const items = Array.isArray(phrases) ? phrases.slice(0, 6) : [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🗣️</span>
        <h3 className="text-lg font-extrabold text-slate-900">Essential Phrases</h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-600 mb-4">
        Tap a card to flip and see the translation + pronunciation.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, idx) => (
          <FlipCard key={idx} phrase={p} />
        ))}
      </div>
    </div>
  );
}

function FlipCard({ phrase }) {
  const [flipped, setFlipped] = useState(false);
  const front = phrase?.phrase || 'Phrase';
  const translation = phrase?.translation || 'Translation';
  const pron = phrase?.pronunciation || '';

  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className="relative h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {!flipped ? (
        <div className="flex h-full flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-500">English</span>
          <span className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-2">{front}</span>
          <span className="text-[10px] text-slate-500">Tap to flip</span>
        </div>
      ) : (
        <div className="flex h-full flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-500">Local + Pronunciation</span>
          <div>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-2">{translation}</p>
            {pron && <p className="text-[11px] text-slate-600 mt-1">/ {pron} /</p>}
          </div>
          <span className="text-[10px] text-slate-500">Tap to flip back</span>
        </div>
      )}
    </button>
  );
}
