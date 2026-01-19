// Imagine a user searches a a new city which is not that much famous or maybe not able to find out by AI so instead of showing a white screen just show some general details which atleast looks useful

export function defaultDestinationProfile(name) {
  return {
    name,
    description: 'A wonderful place to visit.',
    history: '',
    vibe: '',
    best_time: '',

    currency: 'Local currency varies — carry some cash, plus a card/UPI backup where supported.',
    language: 'Local language varies — English is commonly understood in tourist areas.',
    timezone: '',

    attractions: [],
    accessibility: {
      nearest_airport: { name: 'Nearest airport (add details)', distance_km: null },
      nearest_railway: { name: 'Nearest railway station (add details)', distance_km: null },
      last_mile_connectivity: { mode: 'Taxi or bus', avg_cost: null },
    },

    connectivity: {
      sim: 'If you rely on data, get a local SIM/eSIM where available and download offline maps before you arrive.',
      wifi: 'Wi‑Fi is usually available in hotels/cafes; confirm reliability if you need to work.',
    },

    local_rules: [
      { title: 'Weather', description: 'Check the forecast and pack layers/rain protection as needed.' },
      { title: 'Cash', description: 'Carry some cash for small vendors; cards/UPI may not work everywhere.' },
    ],

    emergency: {
      note: 'Save local emergency numbers and your hotel/host contact before heading out.'
    },

    video_ids: [],
    essential_phrases: [],
  };
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// replace the old data with new AI provided data but never replace something to nothing like if AI returns "" empty string then done replace the existing data
export function mergeNonEmpty(base, patch) {
  if (!patch) return base;

  const out = Array.isArray(base) ? [...base] : isPlainObject(base) ? { ...base } : base;

  // Arrays: replace only if it has at least 1 element
  if (Array.isArray(out) && Array.isArray(patch)) {
    return patch.length > 0 ? patch : out;
  }

  // Objects
  if (isPlainObject(out) && isPlainObject(patch)) {
    for (const [key, patchVal] of Object.entries(patch)) {
      const baseVal = out[key];

      if (patchVal === null || patchVal === undefined) continue;

      if (isNonEmptyString(patchVal)) {
        out[key] = patchVal.trim();
        continue;
      }

      if (Array.isArray(patchVal)) {
        if (patchVal.length > 0) out[key] = patchVal;
        continue;
      }

      if (isPlainObject(patchVal)) {
        out[key] = mergeNonEmpty(isPlainObject(baseVal) ? baseVal : {}, patchVal);
        continue;
      }

      // numbers/booleans/etc: allow overwrite
      out[key] = patchVal;
    }

    return out;
  }

  // Primitive: overwrite only if patch is a non-empty string; otherwise keep base
  if (isNonEmptyString(patch)) return patch.trim();
  return out;
}

// it check whether the data is fully added or not is yes then dont call ai otherwise make a call and set the data

export function destinationNeedsEnrichment(dest) {
  const d = dest || {};
  const hasLocalRules = Array.isArray(d.local_rules) && d.local_rules.length > 0;

  return !(
    isNonEmptyString(d.description) &&
    isNonEmptyString(d.currency) &&
    isNonEmptyString(d.language) &&
    isPlainObject(d.accessibility) &&
    isPlainObject(d.connectivity) &&
    isNonEmptyString(d.connectivity?.sim) &&
    hasLocalRules
  );
}

// Fetch up to 3 YouTube video IDs for a destination name using YouTube Data API v3.
// If no API key is present or an error occurs, return a set of placeholder IDs.
export async function ensureVideoIds(name, existing = []) {
  if (Array.isArray(existing) && existing.length > 0) return existing;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return ['dQw4w9WgXcQ', '5qap5aO4i9A', 'Dx5qFachd3A']; // safe placeholders
  }

  try {
    const query = encodeURIComponent(`${name} travel vlog`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&type=video&q=${query}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API error ${res.status}`);
    const data = await res.json();
    const ids = (data.items || [])
      .map((item) => item?.id?.videoId)
      .filter(Boolean)
      .slice(0, 3);
    return ids.length ? ids : ['dQw4w9WgXcQ', '5qap5aO4i9A', 'Dx5qFachd3A'];
  } catch (err) {
    console.error('YouTube fetch failed:', err);
    return ['dQw4w9WgXcQ', '5qap5aO4i9A', 'Dx5qFachd3A'];
  }
}
