'use client';

import { useState } from 'react';

export default function ShareTripModal({ tripId, open, onClose, onShared }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to share');
      onShared?.(json.data);
      setEmail('');
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to share trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Share this trip</h2>
            <p className="text-sm text-slate-600 mt-1">Invite collaborators by email.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 rounded-lg p-1 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
              Collaborator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20"
              placeholder="friend@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white py-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
