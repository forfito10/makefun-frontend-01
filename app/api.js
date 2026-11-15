// make.fun's public API, read-only GETs with ETag revalidation: an If-None-Match within
// the same minute answers 304 (free), the minute's turn answers 200 with fresh data.
// Identical in-flight requests share one promise, so a view never fetches twice.

const API = 'https://make.fun/api';
const cache = new Map(); // path -> { etag, body }
const inflight = new Map(); // path -> Promise

async function request(path) {
  const hit = cache.get(path);
  const headers = hit ? { 'if-none-match': hit.etag } : {};
  const res = await fetch(API + path, { headers });
  if (res.status === 304 && hit) return hit.body;
  if (!res.ok) throw new Error(`GET ${path} answered HTTP ${res.status}`);
  const etag = res.headers.get('etag');
  const body = await res.json();
  if (etag) cache.set(path, { etag, body });
  return body;
}

/** One GET of the API, cached and revalidated by ETag; identical calls share one request. */
export function get(path) {
  if (!inflight.has(path)) {
    inflight.set(
      path,
      request(path).finally(() => inflight.delete(path)),
    );
  }
  return inflight.get(path);
}

/** The bounties, one page at a time: { items, nextCursor }. */
export const getBounties = (query) => get(`/competitions?status=open&activity=times${query ?? ''}`);

/** A bounty's posted result (entries with their values, shown when live rows are withheld). */
export const getResults = (slug) => get(`/competitions/${encodeURIComponent(slug)}/results`);

/** One bounty by slug. */
export const getBounty = (slug) => get(`/competitions/${encodeURIComponent(slug)}`);

/** A bounty's leaderboard: { columns, rows }. */
export const getLeaderboard = (slug) => get(`/competitions/${encodeURIComponent(slug)}/leaderboard`);

/** An account's public profile. */
export const getProfile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);

/** The site's all-time rankings: { items, nextCursor }. */
export const getRankings = (query) => get(`/rankings?limit=24${query ?? ''}`);
