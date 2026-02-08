'use client';

export default function VideoGallery({ videoIds = [] }) {
  // Defensive check: Ensure it's an array and take top 3
  const ids = Array.isArray(videoIds) ? videoIds.slice(0, 3) : [];

  // If no videos found, hide the component completely (don't show "Loading")
  if (ids.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-extrabold text-slate-900 mb-3">Travel Vlogs</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((id) => (
          <div key={id} className="aspect-video rounded-xl overflow-hidden border border-slate-100 shadow-sm">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${id}`}
              title="Travel vlog"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ))}
      </div>
    </div>
  );
}
