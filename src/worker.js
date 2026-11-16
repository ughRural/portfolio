// Runs in front of the static site.
//  - mathrawala.com (and www) redirect to aavidm.com, the main address
//  - /api/today returns today's TickTick items; the token lives in the TICKTICK_TOKEN secret, never in the page
const MAIN_HOST = 'aavidm.com';
const TZ = 'America/New_York';
const API = 'https://api.ticktick.com/open/v1';
const CACHE_SECONDS = 300;

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const day = (d) => dayFmt.format(d); // yyyy-mm-dd in eastern time

async function ticktick(path, token) {
  const res = await fetch(API + path, { headers: { Authorization: 'Bearer ' + token } });
  if (!res.ok) throw new Error('ticktick ' + res.status);
  return res.json();
}

async function todaysItems(token) {
  const projects = (await ticktick('/project', token)).filter((p) => !p.closed);
  const ids = ['inbox'].concat(projects.map((p) => p.id));
  const lists = await Promise.all(ids.map((id) =>
    ticktick('/project/' + id + '/data', token).then((d) => d.tasks || [], () => [])));

  const today = day(new Date());
  const items = [];
  lists.flat().forEach((t) => {
    if (t.status !== 0 || !(t.startDate || t.dueDate)) return;
    const start = new Date(t.startDate || t.dueDate);
    let end = new Date(t.dueDate || t.startDate);
    // something ending exactly at midnight belongs to the day before
    if (!t.isAllDay && end > start) end = new Date(end.getTime() - 1);
    if (day(start) > today || day(end) < today) return;
    // only the title and the times leave the server: no notes, tags, or list names
    items.push({
      title: t.title,
      allDay: !!t.isAllDay,
      start: start.toISOString(),
      end: new Date(t.dueDate || t.startDate).toISOString(),
    });
  });
  items.sort((a, b) => (b.allDay - a.allDay) || a.start.localeCompare(b.start));
  return { date: today, items };
}

async function today(request, env, ctx) {
  const cache = caches.default;
  const key = new Request(new URL('/api/today', request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  let res;
  try {
    if (!env.TICKTICK_TOKEN) throw new Error('no token');
    res = Response.json(await todaysItems(env.TICKTICK_TOKEN), {
      headers: { 'Cache-Control': 'public, max-age=' + CACHE_SECONDS },
    });
    ctx.waitUntil(cache.put(key, res.clone()));
  } catch (err) {
    res = Response.json({ error: 'calendar unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === 'www.' + MAIN_HOST || url.hostname.endsWith('mathrawala.com')) {
      url.hostname = MAIN_HOST;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/api/today') return today(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
};
