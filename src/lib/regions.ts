export const SOUTH_INDIAN_STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
];

export function isSouthIndia(state?: string | null): boolean {
  if (!state) return false;
  const s = state.trim().toLowerCase();
  return SOUTH_INDIAN_STATES.some((x) => x.toLowerCase() === s);
}

export function getISTHour(date: Date = new Date()): number {
  // IST is UTC+5:30
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + 5.5 * 60 * 60000);
  return ist.getHours();
}

export function shouldUseLightTheme(state?: string | null, date: Date = new Date()): boolean {
  const hour = getISTHour(date);
  return isSouthIndia(state) && hour >= 10 && hour < 12;
}

export interface GeoInfo {
  city: string;
  region: string; // state
  country: string;
}

export async function fetchGeoInfo(): Promise<GeoInfo> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("geo failed");
    const data = await res.json();
    return {
      city: data.city || "Unknown",
      region: data.region || "Unknown",
      country: data.country_name || "Unknown",
    };
  } catch {
    return { city: "Unknown", region: "Unknown", country: "Unknown" };
  }
}
