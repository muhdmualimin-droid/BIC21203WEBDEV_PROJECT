'use strict';

const Announcements = {
  rows: [],
  seen: new Map(),
  auto: false,
  busy: false,
  tickerMessage: '',
  lastSignature: '',

  speak(text) {
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-MY';
    utterance.onerror = () => {
      const status = document.getElementById('speechStatus');
      if (status) status.textContent = 'Speech could not play. Check browser voice support and sound settings.';
    };
    speechSynthesis.speak(utterance);
  },

  visibleRows() {
    const type = document.getElementById('typeFilter')?.value;
    const station = document.getElementById('alertStation')?.value;

    return this.rows.filter(alert => (
      (!type || alert.type === type)
      && (!station || String(alert.station_id) === station || alert.station_id === null)
    ));
  },

  alertCard(alert) {
    const classByType = { info: 'info', delay: 'delayed', alert: 'cancelled' };
    const card = PIS.el('article', '', 'card alert-card');
    const expiry = alert.expires_at || 'No expiry';

    card.append(
      PIS.el('span', alert.type, `pill pill-${classByType[alert.type]}`),
      PIS.el('h2', alert.title),
      PIS.el('p', alert.body),
      PIS.el('p', `${alert.station_name || 'All stations'} · Expires: ${expiry}`, 'muted'),
    );

    if ('speechSynthesis' in window) {
      card.append(PIS.button('Speak', () => this.speak(`${alert.title}. ${alert.body}`)));
    }

    return card;
  },

  render() {
    const container = document.getElementById('announcements');
    if (!container) return;

    const rows = this.visibleRows();
    const displayedRows = PIS.page === 'index' ? rows.slice(0, 4) : rows;

    container.replaceChildren();

    if (!displayedRows.length) {
      container.append(PIS.el('p', 'No active announcements.', 'card'));
      return;
    }

    displayedRows.forEach(alert => container.append(this.alertCard(alert)));

    if (PIS.page === 'index' && rows.length > displayedRows.length) {
      const link = PIS.el('a', `View all ${rows.length} service alerts`, 'btn btn-ghost');
      link.href = 'alerts.html';
      container.append(link);
    }
  },

  updateTicker() {
    const ticker = document.getElementById('tickerTrack');
    if (!ticker) return;

    const message = this.rows.length
      ? this.rows.map(alert => alert.title).join(' • ')
      : 'No active service announcements.';

    if (message === this.tickerMessage) return;

    const primarySequence = PIS.el('span', message, 'ticker-sequence');
    const repeatedSequence = PIS.el('span', message, 'ticker-sequence');
    repeatedSequence.setAttribute('aria-hidden', 'true');

    ticker.replaceChildren(primarySequence, repeatedSequence);
    this.tickerMessage = message;
  },

  async refresh() {
    if (this.busy || document.hidden) return;
    this.busy = true;

    try {
      const result = await PIS.api('announcements.php');
      const nextSignature = JSON.stringify(result.data.map(alert => [
        alert.ann_id,
        alert.title,
        alert.body,
        alert.type,
        alert.station_id,
        alert.expires_at,
      ]));

      if (this.auto) {
        result.data.forEach(alert => {
          if (this.seen.get(alert.ann_id) !== alert.title + alert.body) {
            this.speak(`${alert.title}. ${alert.body}`);
          }
        });
      }

      this.seen = new Map(result.data.map(alert => [alert.ann_id, alert.title + alert.body]));
      this.rows = result.data;
      if (nextSignature !== this.lastSignature) {
        this.updateTicker();
        this.render();
        this.lastSignature = nextSignature;
      }
    } catch (error) {
      const ticker = document.getElementById('tickerTrack');
      const container = document.getElementById('announcements');
      if (ticker) {
        this.tickerMessage = '';
        ticker.textContent = 'Service notices unavailable. Please try again.';
      }
      if (container) {
        container.replaceChildren(PIS.el(
          'p',
          'Service notices are unavailable. Please try again.',
          'flash flash-error',
        ));
      }
    } finally {
      this.busy = false;
    }
  },

  autoLabel() {
    const button = document.getElementById('autoSpeech');
    if (!button) return;

    button.textContent = `Auto-broadcast: ${this.auto ? 'On' : 'Off'}`;
    button.setAttribute('aria-pressed', String(this.auto));
  },

  initialiseSpeechControls() {
    const supported = 'speechSynthesis' in window;
    const status = document.getElementById('speechStatus');

    if (status) {
      status.textContent = supported
        ? 'Speech is off until you choose a control.'
        : 'Speech synthesis is not supported by this browser. Read the displayed text instead.';
    }

    ['speakAll', 'repeatAll', 'stopSpeech', 'autoSpeech'].forEach(id => {
      const button = document.getElementById(id);
      if (button) button.disabled = !supported;
    });

    const playAll = times => {
      speechSynthesis.cancel();
      for (let count = 0; count < times; count += 1) {
        this.rows.forEach(alert => this.speak(`${alert.title}. ${alert.body}`));
      }
    };

    document.getElementById('speakAll')?.addEventListener('click', () => playAll(1));
    document.getElementById('repeatAll')?.addEventListener('click', () => playAll(2));
    document.getElementById('stopSpeech')?.addEventListener('click', () => {
      speechSynthesis.cancel();
      this.auto = false;
      this.autoLabel();
    });
    document.getElementById('autoSpeech')?.addEventListener('click', () => {
      this.auto = !this.auto;
      this.autoLabel();
      if (this.auto) this.speak('Automatic service announcements enabled.');
      else speechSynthesis.cancel();
    });
  },

  async start() {
    this.initialiseSpeechControls();

    const container = document.getElementById('announcements');
    if (container) PIS.skeleton(container, PIS.page === 'index' ? 2 : 4, 1);

    ['typeFilter', 'alertStation'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => this.render());
    });

    if (document.getElementById('alertStation')) {
      const stations = await PIS.api('stations.php');
      PIS.options('alertStation', stations.data, 'station_id', 'name', 'All stations');
    }

    await this.refresh();
    window.setInterval(() => this.refresh(), 15000);
  },
};
