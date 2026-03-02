const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function formatAddressForGeocode(address) {
  const a = address.trim();
  if (!a) return '';
  const lower = a.toLowerCase();
  if (lower.includes(' fl ') || lower.endsWith(', fl') || lower.includes(' florida') || lower.includes(', usa')) {
    return a;
  }
  return `${a}, FL, USA`;
}

export async function geocodeAddress(address) {
  if (!address || address.trim() === '') return null;
  const query = formatAddressForGeocode(address);
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DoubleADetails/1.0 (car detailing booking)',
      },
    });
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (e) {
    console.warn('Geocode failed for', address, e.message);
    return null;
  }
}

export async function geocodeAppointments(appointments) {
  const coordCache = {};
  const results = [];
  for (const a of appointments) {
    const addr = (a.address || '').trim();
    if (!addr) continue;
    const key = addr.toLowerCase();
    if (!coordCache[key]) {
      const coords = await geocodeAddress(addr);
      coordCache[key] = coords;
      await new Promise((r) => setTimeout(r, 1100));
    }
    if (coordCache[key]) {
      results.push({ ...a, lat: coordCache[key].lat, lng: coordCache[key].lng });
    }
  }
  return results;
}
