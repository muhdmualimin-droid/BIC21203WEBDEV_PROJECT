'use strict';

function lineCard(line) {
  const card = PIS.el('article', '', 'card line-card');
  const bar = PIS.el('span', '', 'line-bar');
  const link = PIS.el('a', 'Route details', 'btn');

  if (/^#[0-9a-f]{6}$/i.test(line.colour_hex)) bar.style.background = line.colour_hex;
  link.href = `route.html?line_id=${encodeURIComponent(line.line_id)}`;
  card.append(bar, PIS.el('h2', line.name), PIS.el('p', line.description), link);
  return card;
}

function routeSchematic(line, timetable) {
  const firstTrainId = timetable[0]?.train_id;
  const stops = timetable.filter(stop => stop.train_id === firstTrainId);
  if (!stops.length) return null;

  const namespace = 'http://www.w3.org/2000/svg';
  const colour = /^#[0-9a-f]{6}$/i.test(line.colour_hex) ? line.colour_hex : '#005bbb';
  const svg = document.createElementNS(namespace, 'svg');
  const height = 86 + stops.length * 42;

  svg.setAttribute('viewBox', `0 0 560 ${height}`);
  svg.classList.add('route-schematic');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${line.name} station schematic`);

  const routeLine = document.createElementNS(namespace, 'line');
  Object.entries({ x1: 54, y1: 42, x2: 54, y2: 42 + (stops.length - 1) * 42, stroke: colour, 'stroke-width': 7 })
    .forEach(([key, value]) => routeLine.setAttribute(key, value));
  svg.append(routeLine);

  stops.forEach((stop, index) => {
    const y = 42 + index * 42;
    const marker = document.createElementNS(namespace, 'circle');
    const label = document.createElementNS(namespace, 'text');

    Object.entries({ cx: 54, cy: y, r: 9, fill: '#fff', stroke: colour, 'stroke-width': 4 })
      .forEach(([key, value]) => marker.setAttribute(key, value));
    label.setAttribute('x', '78');
    label.setAttribute('y', String(y + 4));
    label.setAttribute('font-size', '16');
    label.setAttribute('font-weight', index === 0 || index === stops.length - 1 ? '700' : '600');
    label.textContent = stop.station_name;
    svg.append(marker, label);
  });

  const figure = PIS.el('figure', '', 'card route-figure');
  figure.append(svg, PIS.el('figcaption', 'Stations in the first scheduled train’s travel order. Facilities are listed below.', 'muted'));
  return figure;
}

function routeSection(title, columns, rows) {
  const card = PIS.el('section', '', 'card');
  const table = PIS.el('div');
  card.append(PIS.el('h2', title), table);
  PIS.table(table, columns, rows);
  return card;
}

async function loadRoutesPage() {
  const result = await PIS.api('routes.php');
  document.getElementById('routes').replaceChildren(...result.data.map(lineCard));
}

async function loadRouteDetailsPage() {
  const lineId = new URLSearchParams(location.search).get('line_id') || '';
  const result = await PIS.api(`routes.php?line_id=${encodeURIComponent(lineId)}`);
  const { line, stations, trains, timetable } = result.data;
  const container = document.getElementById('routeDetails');
  const overview = PIS.el('section', '', 'card');
  const backLink = PIS.el('a', 'Back to all routes', 'btn btn-ghost');

  backLink.href = 'routes.html';
  overview.append(PIS.el('h2', line.name), PIS.el('p', line.description), backLink);
  container.replaceChildren(overview);

  const schematic = routeSchematic(line, timetable);
  if (schematic) container.append(schematic);

  container.append(
    routeSection('Stations & accessibility', [
      ['name', 'Station'], ['code', 'Code'], ['facilities', 'Facilities'],
      [row => Number(row.is_active) ? 'Active' : 'Inactive', 'Condition'],
    ], stations),
    routeSection('Available trains', [
      ['train_number', 'Train'], ['train_type', 'Type'], ['direction', 'Direction'], ['status', 'Condition'],
    ], trains),
    routeSection('Timetable (stored sample schedule)', [
      ['train_number', 'Train'], ['stop_seq', 'Stop'], ['station_name', 'Station'],
      ['arrival', 'Arrival'], ['departure', 'Departure'],
    ], timetable),
  );
}

function bindContactForm() {
  PIS.bindForm('contactForm', async (data, form) => {
    const result = await PIS.api('contact.php', data);
    PIS.notice(result.message);
    form.reset();
  });
}

async function startPublic() {
  if (PIS.page === 'routes') await loadRoutesPage();
  if (PIS.page === 'route') await loadRouteDetailsPage();

  bindContactForm();
  await Board.start();
}
