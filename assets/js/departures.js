'use strict';

const Board = {
  rows: [],
  busy: false,
  lastSuccess: '',
  lastSignature: '',

  formatDirection(direction) {
    return direction
      ? direction.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
      : 'Not available';
  },

  formatStatus(status) {
    const labels = {
      on_time: 'On Time',
      delayed: 'Delayed',
      arriving: 'Arriving',
      cancelled: 'Cancelled',
    };
    return labels[status] || 'No Report';
  },

  formatSource(row) {
    if (!row.update_id) return 'No Report';

    const labels = {
      staff_manual: 'Staff Updated',
      local_demo: 'Demo Feed',
      legacy_demo: 'Legacy Demo',
    };
    return labels[row.source_api] || 'Unverified Record';
  },

  formatTime(value) {
    if (!value) return '';
    const matchedTime = String(value).match(/(\d{2}):(\d{2})/);
    return matchedTime ? matchedTime[1] + ':' + matchedTime[2] : '';
  },

  departureTime(row) {
    const eta = this.formatTime(row.eta);
    const scheduled = this.formatTime(row.scheduled_time);
    if (eta) return 'ETA ' + eta;
    if (scheduled) return 'Scheduled ' + scheduled;
    return 'Not Set';
  },

  updatedTime(row) {
    const time = this.formatTime(row.fetched_at);
    return time ? time + ' MYT' : 'Not available';
  },

  badge(row) {
    const label = this.formatStatus(row.status);
    const delay = row.status === 'delayed' && Number(row.delay_min) > 0
      ? ' +' + row.delay_min + ' min'
      : '';
    return PIS.el('span', label + delay, 'pill pill-' + (row.status || 'info'));
  },

  filteredRows() {
    const search = (document.getElementById('search')?.value || '').toLowerCase();
    const line = document.getElementById('lineFilter')?.value;
    const station = document.getElementById('stationFilter')?.value;

    return this.rows.filter(row => (
      row.train_number.toLowerCase().includes(search)
      && (!line || String(row.line_id) === line)
      && (!station || String(row.station_id) === station)
    ));
  },

  render() {
    PIS.table('board', [
      ['train_number', 'Train'],
      ['line_name', 'Line'],
      [row => this.formatDirection(row.direction), 'Direction'],
      ['station_name', 'Station'],
      [row => this.departureTime(row), 'Departure / ETA'],
      [row => this.badge(row), 'Journey Status'],
      [row => this.updatedTime(row), 'Updated'],
      [row => this.formatSource(row), 'Source'],
    ], this.filteredRows(), null, 'departure-board');
  },

  signature(rows) {
    return JSON.stringify(rows.map(row => [
      row.train_id,
      row.train_number,
      row.line_id,
      row.station_id,
      row.direction,
      row.scheduled_time,
      row.eta,
      row.status,
      row.delay_min,
      row.fetched_at,
      row.update_id,
      row.source_api,
    ]));
  },

  setRefreshStatus(message) {
    const status = document.getElementById('refreshStatus');
    if (status) status.textContent = message;
  },

  async refresh() {
    if (this.busy || document.hidden) return;
    this.busy = true;

    try {
      const suffix = PIS.page === 'status' ? '?all=1' : '';
      const result = await PIS.api('departures.php' + suffix);
      const nextRows = result.data.rows;
      const nextSignature = this.signature(nextRows);
      const changed = nextSignature !== this.lastSignature;
      this.rows = nextRows;
      if (changed) {
        this.render();
        this.lastSignature = nextSignature;
        document.getElementById('board')?.classList.add('content-revealed');
      }
      PIS.stats(result.data.stats);
      document.getElementById('board').classList.remove('is-stale');
      this.lastSuccess = new Date().toLocaleTimeString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit',
        minute: '2-digit',
      });
      this.setRefreshStatus(
        'Last successful refresh: ' + this.lastSuccess + ' MYT · every 15 seconds',
      );
    } catch (error) {
      if (!this.rows.length) {
        document.getElementById('board').replaceChildren(PIS.el(
          'p',
          'Departure information is unavailable. Please try again.',
          'empty-state flash-error',
        ));
      }
      this.setRefreshStatus(
        'Unable to refresh: ' + error.message
        + ' Previous rows are retained. Last success: ' + (this.lastSuccess || 'none'),
      );
      document.getElementById('board').classList.add('is-stale');
    } finally {
      this.busy = false;
    }
  },

  async start() {
    if (!document.getElementById('board')) return;

    PIS.skeleton('board', 5, 5);
    document.getElementById('board')?.setAttribute('aria-busy', 'true');

    const [lines, stations] = await Promise.all([
      PIS.api('routes.php'),
      PIS.api('stations.php'),
    ]);
    PIS.options('lineFilter', lines.data, 'line_id', 'name', 'All Lines');
    PIS.options('stationFilter', stations.data, 'station_id', 'name', 'All Stations');

    ['search', 'lineFilter', 'stationFilter'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.render());
    });

    await this.refresh();
    document.getElementById('board')?.setAttribute('aria-busy', 'false');
    setInterval(() => this.refresh(), 15000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.refresh();
    });
  },
};
