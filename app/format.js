// Small helpers for showing API values as HTML.

/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A dollar amount ('1000.00' or 0.5) as '$1,000' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });
}

/** A deadline as a short UTC date. */
export function date(iso) {
  return `${new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
}

/** The time until a deadline: '2d 4h left', '35m left', 'ended'. */
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

/** Whether a bounty still takes entries: by its deadline, not its status alone. */
export function openByDeadline(iso) {
  return new Date(iso).getTime() > Date.now();
}

/** The live reward: the prize pot as it stands. */
export const pot = (b) => money(b.potUsd ?? b.rewardAmount);

/** A fragment of the markdown a bounty's description starts with, with headings and code stripped. */
export function excerpt(text, max = 220) {
  const plain = String(text ?? '').replace(/^#+ .*/gm, '').replace(/```[\s\S]*?```/g, ' ').replace(/[#*`>\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

/** One skeleton placeholder card while data loads. */
export const skeleton = () => '<div class="skel"></div>';
export const skeletonGrid = (n = 6) => `<div class="skelgrid">${skeleton().repeat(n)}</div>`;
