(function () {
  'use strict';

  const ZONE = 'Europe/Madrid';
  const PAGE_SIZE = 7;
  const HORIZON = 28;
  const MONTH_DAY = new Intl.DateTimeFormat('es-ES', {day: 'numeric', month: 'short', timeZone: ZONE});
  const WEEK_DAY = new Intl.DateTimeFormat('es-ES', {weekday: 'short', timeZone: ZONE});
  const FULL_DAY = new Intl.DateTimeFormat('es-ES', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONE});

  function dateKey(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: ZONE
    }).formatToParts(date);
    const get = name => parts.find(part => part.type === name).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  // Preserve the five bands published by bite-times, including its 4.25 excellent threshold.
  function stars(rating) {
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) return null;
    return rating < 1.5 ? 1 : rating < 2.5 ? 2 : rating < 3.5 ? 3 : rating < 4.25 ? 4 : 5;
  }

  function forecast(data, now) {
    if (data?.timeZone !== ZONE || data?.location?.name !== 'Mallorca' || !Array.isArray(data.days)) return [];
    const today = dateKey(now);
    const first = data.days.findIndex(row => Array.isArray(row) && row[0] === today);
    if (first < 0) return [];
    const available = data.days.slice(first, first + HORIZON);
    return available.every((row, index) => Array.isArray(row) && stars(row[1]) !== null &&
      row[0] === new Date(Date.parse(`${today}T12:00:00Z`) + index * 86400000).toISOString().slice(0, 10)) ? available : [];
  }

  if (typeof module === 'object' && module.exports) module.exports = {dateKey, stars, forecast};
  if (typeof document === 'undefined') return;

  const host = document.getElementById('fishingSolunar');
  if (!host) return;
  const daysHost = host.querySelector('[data-solunar-days]');
  const rangeHost = host.querySelector('[data-solunar-range]');
  const summaryHost = host.querySelector('[data-solunar-summary]');
  const previous = host.querySelector('[data-solunar-prev]');
  const next = host.querySelector('[data-solunar-next]');
  let page = 0;
  let lastToday = '';

  function render() {
    const now = new Date();
    const today = dateKey(now);
    if (lastToday && lastToday !== today) page = 0;
    lastToday = today;
    const all = forecast(window.BC_SOLUNAR_DATA, now);
    if (!all.length) {
      daysHost.replaceChildren();
      rangeHost.textContent = '';
      summaryHost.textContent = 'Previsión solunar no disponible';
      previous.disabled = next.disabled = true;
      return;
    }
    page = Math.min(page, Math.floor((all.length - 1) / PAGE_SIZE));
    const rows = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const best = rows.reduce((a, b) => b[1] > a[1] ? b : a);
    const worst = rows.reduce((a, b) => b[1] < a[1] ? b : a);
    const format = key => MONTH_DAY.format(new Date(`${key}T12:00:00Z`)).replace(/\./g, '');
    rangeHost.textContent = `${format(rows[0][0])} – ${format(rows[rows.length - 1][0])}`;
    summaryHost.textContent = best[1] === worst[1] ? 'Actividad similar estos días' :
      `Mejor: ${format(best[0])} · Menor: ${format(worst[0])}`;
    const fragment = document.createDocumentFragment();
    for (const [key, rating] of rows) {
      const date = new Date(`${key}T12:00:00Z`);
      const count = stars(rating);
      const cell = document.createElement('li');
      cell.className = 'solunar-day' + (key === today ? ' solunar-today' : '') +
        (key === best[0] && best[1] > worst[1] ? ' solunar-best' : '');
      cell.dataset.date = key;
      cell.dataset.stars = count;
      cell.setAttribute('aria-label', `${FULL_DAY.format(date)}: ${count} de 5 estrellas de actividad solunar estimada`);
      if (key === today) cell.setAttribute('aria-current', 'date');
      const label = document.createElement('span');
      label.className = 'solunar-weekday';
      label.textContent = key === today ? 'Hoy' : WEEK_DAY.format(date).replace(/\./g, '');
      const number = document.createElement('span');
      number.className = 'solunar-number';
      number.textContent = String(date.getUTCDate());
      const value = document.createElement('span');
      value.className = 'solunar-stars';
      value.setAttribute('aria-hidden', 'true');
      const filled = document.createElement('span');
      filled.textContent = '★'.repeat(count);
      const empty = document.createElement('span');
      empty.className = 'solunar-empty';
      empty.textContent = '☆'.repeat(5 - count);
      value.append(filled, empty);
      cell.append(label, number, value);
      fragment.appendChild(cell);
    }
    daysHost.replaceChildren(fragment);
    previous.disabled = page === 0;
    next.disabled = (page + 1) * PAGE_SIZE >= all.length;
  }

  previous.addEventListener('click', () => {page = Math.max(0, page - 1); render();});
  next.addEventListener('click', () => {page += 1; render();});
  document.addEventListener('visibilitychange', () => {if (!document.hidden) render();});
  window.addEventListener('pageshow', render);
  setInterval(() => {if (dateKey(new Date()) !== lastToday) render();}, 60000);
  render();
}());
