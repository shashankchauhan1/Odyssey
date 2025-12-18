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
  };
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function mergeNonEmpty(base, patch) {
  if (!patch) return base;

  const out = Array.isArray(base) ? [...base] : isPlainObject(base) ? { ...base } : base;

  // Arrays: replace only if patch has at least 1 element
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
