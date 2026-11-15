// The router and pages: hash routes, skeleton placeholders, views updated in place.

import { getBounties, getBounty, getLeaderboard, getProfile, getRankings, getResults } from './api.js';
import { skeleton, skeletonGrid } from './format.js';
import { board, bounty, errorPage, leaderboard, profile, rewards, rankings } from './views.js';

const app = document.getElementById('app');
const state = { query: '', cursor: null, items: [] };

/** The theme toggle: dark/light, remembered. */
document.getElementById('theme').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('mf-theme', next);
});

/** #/bounty/<slug>[/rewards|/leaderboard] parsed from the hash. */
function route() {
  const path = location.hash.replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean); // e.g. ['bounty','x','leaderboard']
  if (parts[0] === 'bounty' && parts[1]) return { page: 'bounty', slug: decodeURIComponent(parts[1]), sub: parts[2] ?? '' };
  if (parts[0] === 'profile' && parts[1]) return { page: 'profile', handle: decodeURIComponent(parts[1]) };
  if (parts[0] === 'rankings') return { page: 'rankings' };
  if (parts[0] === 'about') return { page: 'about' };
  return { page: 'board' };
}

/** One bounty page by its sub-tab. */
async function showBounty(slug, sub) {
  const b = await getBounty(slug);
  document.title = `${b.title} | make.fun bounties`;
  app.innerHTML = sub === 'rewards' ? rewards(b) : sub === 'leaderboard' ? skeleton() : bounty(b);
  if (sub === 'leaderboard') {
    let data = null, fallback = null;
    try { data = await getLeaderboard(slug); } catch { data = null; }
    if (!data || !(data.rows ?? []).length) fallback = await getResults(slug);
    app.innerHTML = leaderboard(data ?? fallback.board, slug, fallback);
  }
}

/** The board, with a client-side filter and "Load more" by cursor. */
async function showBoard() {
  document.title = 'make.fun bounties';
  if (state.items.length === 0) {
    const data = await getBounties();
    state.items = data.items;
    state.cursor = data.nextCursor ?? null;
  }
  renderBoard();
  const q = document.getElementById('q');
  q.addEventListener('input', () => { state.query = q.value; renderBoard(); replaceQuery(); });
  const more = document.getElementById('more');
  if (more) more.addEventListener('click', loadMore);
}

function renderBoard() {
  const q = state.query.trim().toLowerCase();
  const items = state.items.filter((b) => !q || b.title.toLowerCase().includes(q) || (b.skills ?? []).some((s) => s.toLowerCase().includes(q)));
  const app_html = board({ items, nextCursor: state.cursor }, state.query);
  app.innerHTML = app_html;
  const q2 = document.getElementById('q');
  q2.addEventListener('input', () => { state.query = q2.value; renderBoard(); });
  const more = document.getElementById('more');
  if (more) more.addEventListener('click', loadMore);
}

function replaceQuery() { history.replaceState(null, '', location.pathname + location.search + location.hash); }

async function loadMore() {
  const more = document.getElementById('more');
  if (more) more.textContent = 'Loading…';
  const data = await getBounties(state.cursor ? `&cursor=${encodeURIComponent(state.cursor)}` : '');
  state.items = state.items.concat(data.items);
  state.cursor = data.nextCursor ?? null;
  renderBoard();
}

/** The all-time rankings. */
async function showRankings() {
  document.title = 'Rankings | make.fun bounties';
  app.innerHTML = rankings({ items: [] });
  const data = await getRankings();
  app.innerHTML = rankings(data);
}

async function showProfile(handle) {
  document.title = `@${handle} | make.fun bounties`;
  app.innerHTML = skeleton();
  const p = await getProfile(handle);
  app.innerHTML = profile(p);
}

function showAbout() {
  document.title = 'About | make.fun bounties';
  app.innerHTML = `
  <div class="hero"><h1>About this frontend</h1><p>A custom make.fun frontend: static files, no build step, one origin.</p></div>
  <div class="prose">Reads make.fun's public API alone, GET only, revalidated by ETag so a repeat view costs nothing.
  Surfaces: the live bounty board (reward, entry fee, time left, entries), a bounty's page with its rewards table,
  its leaderboard, an account's profile, and the all-time rankings. Hash routes, skeleton placeholders, dark and light.</div>`;
}

/** Render whatever the hash names; window.__shotReady marks the data on screen. */
async function render() {
  window.__shotReady = false;
  const r = route();
  document.querySelectorAll('.top nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${r.page === 'bounty' || r.page === 'profile' ? '/' : `/${r.page}`}`));
  try {
    if (r.page === 'board') await showBoard();
    else if (r.page === 'bounty') await showBounty(r.slug, r.sub);
    else if (r.page === 'profile') await showProfile(r.handle);
    else if (r.page === 'rankings') await showRankings();
    else showAbout();
    window.scrollTo(0, 0);
  } catch (err) {
    app.innerHTML = errorPage(err);
  }
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();
