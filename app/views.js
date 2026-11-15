// Every page as a function from API data to HTML.

import { date, esc, excerpt, money, openByDeadline, pot, timeLeft } from './format.js';

/** One bounty card on the board. */
function card(b) {
  const fee = b.entryFeeUsd ? `<span class="chip">${money(b.entryFeeUsd)} entry fee</span>` : '';
  const left = openByDeadline(b.deadline) ? `<span class="left">${timeLeft(b.deadline)}</span>` : '<span class="ended">ended</span>';
  return `
  <a class="card" href="#/bounty/${encodeURIComponent(b.slug)}">
    <div class="row"><span class="pot">${pot(b)}</span>${fee}<span class="chip cat">${esc(b.category ?? 'Bounty')}</span></div>
    <h3>${esc(b.title)}</h3>
    <p class="desc">${esc(excerpt(b.summary || b.description, 140))}</p>
    <div class="meta"><span><b>${b.submissionCount}</b> ${b.submissionCount === 1 ? 'entry' : 'entries'}</span>${left}<span>${date(b.deadline)}</span></div>
  </a>`;
}

/** The board: the live bounties, each with its reward, fee, time left and entries. */
export function board(data, query = '') {
  const rows = data.items.map(card).join('');
  return `
  <div class="hero"><h1>Live bounties</h1><p>Build an AI agent, enter, win. Every reward is the live pot.</p></div>
  <div class="toolbar">
    <input id="q" type="search" placeholder="Filter by title or skill…" value="${esc(query)}" autocomplete="off">
    <span class="chip">${data.items.length} shown</span>
  </div>
  <div class="cards">${rows || '<p>No bounties match.</p>'}</div>
  ${data.nextCursor ? '<button class="seg more" id="more">Load more</button>' : ''}`;
}

/** Tabs of one bounty's page. */
export function bountyTabs(slug, active) {
  const tab = (path, label) => `<a href="#/bounty/${encodeURIComponent(slug)}${path}" class="${active === label ? 'active' : ''}">${label}</a>`;
  return `<div class="tabs">${tab('', 'Overview')}${tab('/rewards', 'Rewards')}${tab('/leaderboard', 'Leaderboard')}</div>`;
}

/** The bounty's facts strip. */
function facts(b) {
  const fee = b.entryFeeUsd ? `<div class="fact"><div class="k">Entry fee</div><div class="v">${money(b.entryFeeUsd)}</div></div>` : '';
  const open = openByDeadline(b.deadline);
  return `
  <div class="facts">
    <div class="fact"><div class="k">Live pot</div><div class="v good">${pot(b)}</div></div>
    ${fee}
    <div class="fact"><div class="k">Deadline</div><div class="v ${open ? 'left' : 'ended'}">${timeLeft(b.deadline)}</div></div>
    <div class="fact"><div class="k">Entries</div><div class="v">${b.submissionCount}</div></div>
    <div class="fact"><div class="k">Status</div><div class="v">${open ? 'Taking entries' : 'Closed'}</div></div>
  </div>`;
}

/** The rewards table: every place's reward, the fee share included. */
export function rewardsTable(b) {
  const rows = (b.rewardsNow ?? []).map((r) => `
    <tr><td><span class="rank">${r.place}</span></td>
    <td>${r.place === 1 ? '1st place' : r.place === 2 ? '2nd place' : r.place === 3 ? '3rd place' : `${r.place}th place`}</td>
    <td class="num">${money(r.baseUsd)}</td><td class="num">${money(r.feeShareUsd)}</td><td class="num"><b>${money(r.amountUsd)}</b></td></tr>`).join('');
  return `<table class="list"><thead><tr><th>Place</th><th>Title</th><th class="num">Reward</th><th class="num">Fee share</th><th class="num">Total</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/** One bounty's overview. */
export function bounty(b) {
  const sponsor = b.sponsor?.name ? `<span>by ${esc(b.sponsor.name)}</span>` : '';
  const skills = (b.skills ?? []).map((s) => `<span class="chip">${esc(s)}</span>`).join('');
  return `
  <p class="crumbs"><a href="#/">← Board</a></p>
  <h1 class="title">${esc(b.title)}</h1>
  <div class="byline">${sponsor}<span class="chip cat">${esc(b.category ?? '')}</span><span>${date(b.deadline)}</span></div>
  ${facts(b)}
  ${bountyTabs(b.slug, 'Overview')}
  <p class="prose">${esc(b.summary ?? '')}</p>
  ${skills ? `<div class="row" style="margin:12px 0">${skills}</div>` : ''}
  <h2 class="sec">Description & rules</h2>
  <div class="prose">${esc(b.description ?? '')}</div>`;
}

/** A bounty's rewards page. */
export function rewards(b) {
  return `
  <p class="crumbs"><a href="#/">← Board</a> · <a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a></p>
  <h1 class="title">${esc(b.title)} — rewards</h1>
  ${facts(b)}
  ${bountyTabs(b.slug, 'Rewards')}
  <h2 class="sec">Rewards table (${pot(b)} live pot)</h2>
  ${rewardsTable(b)}`;
}

/** A bounty's leaderboard page. `fallback` holds a results document when the live rows are withheld. */
export function leaderboard(data, slug, fallback) {
  const cols = (data.columns ?? []).filter((c) => c.key !== 'rank' && c.key !== 'handle');
  const head = cols.map((c) => `<th class="${c.sorting === 'desc' ? 'num' : ''}">${esc(c.title)}</th>`).join('');
  const rows = (data.rows ?? []).map((r) => leaderRow(r, cols, null)).join('');
  const entries = fallback?.board?.entries ?? [];
  const rows2 = entries.map((e) => {
    const tds = cols.map((c) => `<td class="${c.sorting === 'desc' ? 'num' : ''}">${esc(e.display?.[c.key] ?? '')}</td>`).join('');
    return `<tr><td><span class="rank">${e.rank}</span></td><td><a href="#/profile/${encodeURIComponent(e.handle)}">${esc(e.handle ?? '')}</a></td>${tds}</tr>`;
  }).join('');
  return `
  <p class="crumbs"><a href="#/">← Board</a> · <a href="#/bounty/${encodeURIComponent(slug)}">${esc(data.title ?? slug)}</a></p>
  <h1 class="title">${esc(data.title ?? 'Leaderboard')}</h1>
  ${bountyTabs(slug, 'Leaderboard')}
  <table class="list"><thead><tr><th>#</th><th>Account</th>${head}</tr></thead><tbody>${rows2 || rows || '<tr><td colspan="9">No rows yet.</td></tr>'}</tbody></table>`;
}

/** An account's public profile. */
export function profile(p) {
  const links = [
    p.github_login && `<a href="https://github.com/${esc(p.github_login)}" rel="noopener">GitHub</a>`,
    p.x && `<a href="https://x.com/${esc(p.x)}" rel="noopener">X</a>`,
    p.discord && `<span class="chip">Discord: ${esc(p.discord)}</span>`,
  ].filter(Boolean).join(' · ');
  const r = p.record ?? {};
  const sols = (p.solutions ?? []).map((s) => `
    <tr><td><a href="#/bounty/${encodeURIComponent(s.competition?.slug ?? '')}">${esc(s.title ?? '')}</a></td>
    <td>${esc(s.competition?.title ?? '')}</td>
    <td>${s.placement !== null && s.placement !== undefined ? `<span class="rank">${s.placement}</span>` : '—'}</td>
    <td class="num">${s.prize_usd ? money(s.prize_usd) : '—'}</td></tr>`).join('');
  return `
  <div class="phead">
    ${p.image ? `<img src="${esc(p.image)}" crossorigin="anonymous" alt="${esc(p.handle)}'s picture">` : ''}
    <div><h1 class="title">${esc(p.display_name || p.handle)}</h1><div class="byline"><span>@${esc(p.handle)}</span>${links}</div></div>
  </div>
  ${p.bio ? `<p class="prose">${esc(p.bio)}</p>` : ''}
  <div class="statgrid">
    <div class="fact"><div class="k">Entered</div><div class="v">${r.competitions_entered ?? 0}</div></div>
    <div class="fact"><div class="k">Won</div><div class="v">${r.competitions_won ?? 0}</div></div>
    <div class="fact"><div class="k">Placed</div><div class="v">${r.competitions_placed ?? 0}</div></div>
    <div class="fact"><div class="k">Prize money</div><div class="v good">${money(r.prize_usd ?? 0)}</div></div>
    <div class="fact"><div class="k">Joined</div><div class="v" style="font-size:14px">${date(p.joined_at)}</div></div>
  </div>
  <h2 class="sec">Entries</h2>
  <table class="list"><thead><tr><th>Entry</th><th>Bounty</th><th>Place</th><th class="num">Prize</th></tr></thead><tbody>${sols || '<tr><td colspan="4">No entries yet.</td></tr>'}</tbody></table>`;
}

/** The all-time rankings page. */
export function rankings(data) {
  const rows = (data.items ?? []).map((u) => `
    <tr><td><span class="rank">${u.rank}</span></td><td><a href="#/profile/${encodeURIComponent(u.handle)}">${esc(u.handle)}</a></td>
    <td class="num">${u.competitions_won ?? 0}</td><td class="num">${u.competitions_placed ?? 0}</td>
    <td class="num"><b>${money(u.prize_usd ?? u.prizePaidUsd ?? 0)}</b></td></tr>`).join('');
  return `
  <div class="hero"><h1>All-time rankings</h1><p>Accounts by wins or prize money paid.</p></div>
  <table class="list"><thead><tr><th>#</th><th>Account</th><th class="num">Wins</th><th class="num">Placed</th><th class="num">Paid</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5">Loading…</td></tr>'}</tbody></table>`;
}

/** A fatal error page. */
export function errorPage(err) {
  return `<div class="error"><b>Could not load this page.</b><br>${esc(String(err?.message ?? err))}<br><br><a href="#/">← Back to the board</a></div>`;
}
