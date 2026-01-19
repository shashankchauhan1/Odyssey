'use client';

import { useState } from 'react';

export default function SafetyWidget({ tripId, alerts = [], onAlertsUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendAlert = (coords) => {
    setLoading(true);
    setError('');
    fetch(`/api/trips/${tripId}/safety`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Check-in', coords }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || 'Failed to send alert');
        onAlertsUpdate?.(json.data);
      })
      .catch((err) => setError(err.message || 'Failed to send alert'))
      .finally(() => setLoading(false));
  };

  const handleClick = () => {
    if (!navigator?.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        sendAlert(coords);
      },
      (err) => {
        console.error(err);
        setError('Location permission denied. Sending without coordinates.');
        sendAlert({});
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-amber-900">Safety Beacon</h3>
          <p className="text-xs sm:text-sm text-amber-800">Share your latest location with collaborators.</p>
        </div>
        <span className="text-xl">🛰️</span>
      </div>

      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-xl bg-amber-600 text-white font-extrabold text-sm sm:text-base py-3 shadow-sm hover:bg-amber-500 transition disabled:opacity-50"
      >
        {loading ? 'Sending…' : '📍 I’m Here / SOS'}
      </button>

      {error && <p className="mt-3 text-xs text-red-700">{error}</p>}

      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
        {(alerts || []).length === 0 && (
          <p className="text-xs text-amber-800">No alerts yet.</p>
        )}
        {(alerts || []).map((alert, idx) => (
          <div key={idx} className="rounded-lg bg-white border border-amber-100 p-3 text-xs text-amber-900">
            <div className="flex justify-between items-center gap-2">
              <span className="font-bold">{alert.message || 'Check-in'}</span>
              <span className="text-[10px] text-amber-600">
                {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : ''}
              </span>
            </div>
            {alert.coords?.lat && alert.coords?.lng && (
              <p className="text-[11px] text-amber-700 mt-1">
                Lat: {alert.coords.lat.toFixed(4)}, Lng: {alert.coords.lng.toFixed(4)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
