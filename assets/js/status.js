'use strict';

const TrainStatus = {
  trains: [],
  lines: [],
  reports: [],
  selectedId: null,

  title(value) {
    return value
      ? String(value).replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
      : 'Not available';
  },

  time(value) {
    const matchedTime = String(value ?? '').match(/(\d{2}):(\d{2})/);
    return matchedTime ? matchedTime[1] + ':' + matchedTime[2] : '';
  },

  lineName(id) {
    return this.lines.find(line => String(line.line_id) === String(id))?.name || 'Unknown line';
  },

  lineColour(id) {
    return this.lines.find(line => String(line.line_id) === String(id))?.colour_hex || '';
  },

  reportFor(id) {
    return this.reports.find(row => String(row.train_id) === String(id)) || null;
  },

  conditionPill(status) {
    const conditions = {
      active: ['In service', 'pill-on_time'],
      maintenance: ['Maintenance', 'pill-delayed'],
      retired: ['Retired', 'pill-cancelled'],
    };
    const [label, className] = conditions[status] || [this.title(status), 'pill-info'];
    return PIS.el('span', label, 'pill ' + className);
  },

  journeyPill(report) {
    if (!report) return PIS.el('span', 'No report', 'pill pill-info');

    const labels = {
      on_time: 'On Time',
      delayed: 'Delayed',
      arriving: 'Arriving',
      cancelled: 'Cancelled',
    };
    let label = labels[report.status] || 'No Report';
    if (report.status === 'delayed' && Number(report.delay_min) > 0) {
      label += ' +' + report.delay_min + ' min';
    }
    return PIS.el('span', label, 'pill pill-' + (report.status || 'info'));
  },

  sourceLabel(report) {
    if (!report || !report.update_id) return 'No Report';
    const labels = {
      staff_manual: 'Staff Updated',
      local_demo: 'Demo Feed',
      legacy_demo: 'Legacy Demo',
    };
    return labels[report.source_api] || 'Unverified Record';
  },

  filtered() {
    const query = (document.getElementById('trainSearch')?.value || '').toLowerCase().trim();
    const line = document.getElementById('lineFilter')?.value;
    const condition = document.getElementById('conditionFilter')?.value;

    return this.trains.filter(train => (
      [train.train_number, train.train_type, train.direction]
        .some(value => String(value ?? '').toLowerCase().includes(query))
      && (!line || String(train.line_id) === line)
      && (!condition || train.status === condition)
    ));
  },

  render() {
    const container = document.getElementById('results');
    if (!container) return;
    container.replaceChildren();

    const rows = this.filtered();
    if (!rows.length) {
      container.append(PIS.el('p', 'No trains match the current filters.', 'empty-state'));
      return;
    }

    const grid = PIS.el('div', '', 'grid grid-2');
    rows.forEach(train => {
      const card = PIS.el('article', '', 'card line-card train-card');
      const bar = PIS.el('span', '', 'line-bar');
      const colour = this.lineColour(train.line_id);
      if (/^#[0-9a-f]{6}$/i.test(colour)) bar.style.background = colour;

      const statusRow = PIS.el('p', '', 'acts');
      statusRow.append(
        this.conditionPill(train.status),
        this.journeyPill(this.reportFor(train.train_id)),
      );

      const open = PIS.button('View status', () => this.select(train.train_id));
      if (String(this.selectedId) === String(train.train_id)) {
        open.setAttribute('aria-current', 'true');
        open.classList.add('is-on');
      }
      const actions = PIS.el('p', '', 'acts');
      actions.append(open);

      card.append(
        bar,
        PIS.el('h2', train.train_number),
        PIS.el('p', this.lineName(train.line_id) + ' · ' + train.train_type, 'muted'),
        PIS.el('p', this.title(train.direction) + ' · capacity ' + (train.capacity ?? 'not set')),
        statusRow,
        actions,
      );
      grid.append(card);
    });
    container.append(grid);
  },

  updateUrl(id) {
    const url = new URL(location.href);
    if (id === null) url.searchParams.delete('train_id');
    else url.searchParams.set('train_id', id);
    history.replaceState(null, '', url);
  },

  async loadReports() {
    const result = await PIS.api('departures.php?all=1');
    this.reports = result.data.rows;
  },

  async select(id, updateUrl = true) {
    this.selectedId = id;
    if (updateUrl) this.updateUrl(id);
    this.render();
    await this.renderDetail();
    document.getElementById('detail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  async renderDetail() {
    const detail = document.getElementById('detail');
    const body = document.getElementById('detailBody');
    if (!detail || !body) return;

    const train = this.trains.find(item => String(item.train_id) === String(this.selectedId));
    if (!train) {
      detail.hidden = true;
      return;
    }

    detail.hidden = false;
    document.getElementById('detailTitle').textContent = train.train_number;
    document.getElementById('detailCondition').replaceChildren(this.conditionPill(train.status));
    document.getElementById('detailMeta').textContent = [
      this.lineName(train.line_id),
      train.train_type,
      this.title(train.direction),
      'Capacity ' + (train.capacity ?? 'not set'),
    ].join(' · ');

    document.getElementById('detailActions').replaceChildren(
      PIS.button('Check latest report', async () => {
        await this.loadReports();
        this.render();
        await this.renderDetail();
      }),
      PIS.button('Clear selection', async () => {
        this.selectedId = null;
        this.updateUrl(null);
        detail.hidden = true;
        this.render();
      }),
    );

    PIS.skeleton(body, 3, 3);

    let stops = [];
    try {
      const result = await PIS.api('routes.php?line_id=' + encodeURIComponent(train.line_id));
      stops = (result.data.timetable || [])
        .filter(stop => String(stop.train_id) === String(train.train_id))
        .sort((a, b) => Number(a.stop_seq) - Number(b.stop_seq));
    } catch (error) {
      PIS.notice(error.message, true);
    }

    const report = this.reportFor(train.train_id);
    const reportBlock = PIS.el('section', '', 'train-block');
    reportBlock.append(PIS.el('h3', 'Latest journey report'));
    const reportList = PIS.el('ul', '', 'status-list');
    const reportLine = PIS.el('li');
    reportLine.append(
      this.journeyPill(report),
      PIS.el('span', report ? (report.station_name || 'En route') : 'No reported position'),
    );
    reportList.append(reportLine);

    if (report) {
      const eta = this.time(report.eta);
      const scheduled = this.time(report.scheduled_time);
      const detailLine = PIS.el('li', '', 'muted');
      detailLine.textContent = [
        eta ? 'ETA ' + eta : (scheduled ? 'Scheduled ' + scheduled : 'No time set'),
        this.sourceLabel(report),
        'Updated ' + (this.time(report.fetched_at) || 'not available') + ' MYT',
      ].join(' · ');
      reportList.append(detailLine);
    }
    reportBlock.append(reportList);

    const stopsBlock = PIS.el('section', '', 'train-block');
    stopsBlock.append(PIS.el('h3', 'Scheduled stops'));
    const stopsContainer = PIS.el('div', '', 'stop-list');
    if (!stops.length) {
      stopsContainer.append(PIS.el('p', 'No scheduled stops are stored for this train.', 'empty-state'));
    } else {
      stops.forEach(stop => {
        const row = PIS.el('li');
        row.append(
          PIS.el('span', 'Stop ' + stop.stop_seq, 'stop-code'),
          PIS.el('span', stop.station_name || 'Unknown station', 'stop-name'),
          PIS.el('span', [this.time(stop.arrival), this.time(stop.departure)].filter(Boolean).join(' / ') || '—', 'stop-time'),
        );
        stopsContainer.append(row);
      });
    }
    stopsBlock.append(stopsContainer);

    body.replaceChildren(reportBlock, stopsBlock);
  },

  async start() {
    PIS.skeleton('results', 4, 3);

    const params = new URLSearchParams(location.search);
    const search = document.getElementById('trainSearch');
    if (search) search.value = params.get('q') || '';

    ['trainSearch', 'lineFilter', 'conditionFilter'].forEach(id => {
      const element = document.getElementById(id);
      if (!element) return;
      element.addEventListener(id === 'trainSearch' ? 'input' : 'change', () => this.render());
    });
    document.getElementById('clearFilters')?.addEventListener('click', () => {
      ['trainSearch', 'lineFilter', 'conditionFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
      });
      this.render();
    });

    const [trains, lines] = await Promise.all([
      PIS.api('trains.php'),
      PIS.api('routes.php'),
    ]);
    this.trains = trains.data;
    this.lines = lines.data;
    PIS.options('lineFilter', this.lines, 'line_id', 'name', 'All lines');

    await this.loadReports();
    this.render();

    const requestedId = Number(params.get('train_id'));
    if (requestedId) await this.select(requestedId, false);
  },
};
