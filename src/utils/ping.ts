export const SERVERS = [
  { name: 'Google Public DNS', provider: 'GCP', region: 'Global', countryCode: 'global', endpoint: 'dns.google', lat: 0, lon: 0, anycast: true },
  { name: 'Cloudflare', provider: 'CF', region: 'Global', countryCode: 'global', endpoint: 'cloudflare-dns.com/cdn-cgi/trace', lat: 0, lon: 0, anycast: true },
  { name: 'AWS US East', provider: 'AWS', region: 'N. Virginia', countryCode: 'us', endpoint: 'dynamodb.us-east-1.amazonaws.com', lat: 39.0438, lon: -77.4874 },
  { name: 'AWS US West', provider: 'AWS', region: 'N. California', countryCode: 'us', endpoint: 'dynamodb.us-west-1.amazonaws.com', lat: 37.7749, lon: -122.4194 },
  { name: 'AWS Europe', provider: 'AWS', region: 'Frankfurt', countryCode: 'de', endpoint: 'dynamodb.eu-central-1.amazonaws.com', lat: 50.1109, lon: 8.6821 },
  { name: 'AWS Asia Pacific', provider: 'AWS', region: 'Tokyo', countryCode: 'jp', endpoint: 'dynamodb.ap-northeast-1.amazonaws.com', lat: 35.6895, lon: 139.6917 },
  { name: 'AWS Asia Pacific', provider: 'AWS', region: 'Singapore', countryCode: 'sg', endpoint: 'dynamodb.ap-southeast-1.amazonaws.com', lat: 1.3521, lon: 103.8198 },
  { name: 'AWS Asia Pacific', provider: 'AWS', region: 'Hong Kong', countryCode: 'hk', endpoint: 'dynamodb.ap-east-1.amazonaws.com', lat: 22.3193, lon: 114.1694 },
  { name: 'AWS Australia', provider: 'AWS', region: 'Sydney', countryCode: 'au', endpoint: 'dynamodb.ap-southeast-2.amazonaws.com', lat: -33.8688, lon: 151.2093 },
  { name: 'Discord', provider: 'Discord', region: 'Global', countryCode: 'global', endpoint: 'discord.com/cdn-cgi/trace', lat: 0, lon: 0, anycast: true },
  { name: 'Steam', provider: 'Valve', region: 'Global', countryCode: 'global', endpoint: 'store.steampowered.com/robots.txt', lat: 0, lon: 0, anycast: true },
  { name: 'Riot Games', provider: 'Riot', region: 'Global', countryCode: 'global', endpoint: 'ddragon.leagueoflegends.com/api/versions.json', lat: 0, lon: 0, anycast: true },
  { name: 'EA', provider: 'EA', region: 'Global', countryCode: 'global', endpoint: 'www.ea.com/robots.txt', lat: 0, lon: 0, anycast: true },
  { name: 'Battle.net', provider: 'Blizzard', region: 'Global', countryCode: 'global', endpoint: 'oauth.battle.net/.well-known/openid-configuration', lat: 0, lon: 0, anycast: true },
];

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function pingEndpoint(endpoint: string): Promise<number> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout per request

    // NOTE: do NOT append a random cache-busting query param here.
    // `cache: 'no-store'` below already forces a real network round-trip
    // (bypasses the *browser's* HTTP cache). A random query string on top
    // of that also bypasses the *CDN edge* cache for the target, which for
    // WAF/bot-protected domains (Steam/Riot/EA/Battle.net) routes the
    // request all the way to origin and can trigger bot-mitigation delays,
    // inflating measured latency into the thousands of ms. Fixed 2026 —
    // see LOGS.md.
    const url = `https://${endpoint}`;

    await fetch(url, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return Math.round(performance.now() - start);
  } catch (error) {
    throw new Error('Timeout');
  }
}

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
