'use strict';

function formatRecordValue(value) {
  if (value === null || value === undefined || value === '') return '—';

  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

const ADMIN_RECORDS = {
  stations: {
    id: 'station_id',
    columns: [
      ['code', 'Code'],
      ['name', 'Name'],
      ['zone', 'Zone'],
      ['facilities', 'Facilities'],
      [row => Number(row.is_active) ? 'Active' : 'Inactive', 'Operational condition'],
    ],
  },
  trains: {
    id: 'train_id',
    columns: [
      ['train_number', 'Train'],
      ['train_type', 'Type'],
      [row => formatRecordValue(row.direction), 'Direction'],
      ['capacity', 'Capacity'],
      [row => formatRecordValue(row.status), 'Operational condition'],
    ],
  },
  announcements: {
    id: 'ann_id',
    columns: [
      ['title', 'Title'],
      ['body', 'Message'],
      [row => formatRecordValue(row.type), 'Type'],
      ['station_name', 'Station'],
      ['expires_at', 'Expiry'],
    ],
  },
  updates: {
    id: 'update_id',
    columns: [
      ['train_number', 'Train'],
      ['station_name', 'Station'],
      [row => Board.badge(row), 'Journey status'],
      ['eta', 'ETA'],
      [row => Board.formatSource(row), 'Source'],
      ['fetched_at', 'Updated'],
    ],
  },
};

function operationEndpoint(page) {
  return `${page}.php`;
}

function resetEditor(form, page) {
  document.getElementById('formTitle').textContent = page === 'announcements'
    ? 'Add announcement'
    : 'Add / edit record';
  form.elements.id.value = '0';
  if (page === 'updates') form.elements.delay_min.value = '0';
}

function setEditorFeedback(message, error = false) {
  const feedback = document.getElementById('editorFeedback');
  if (!feedback) return;

  feedback.hidden = false;
  feedback.className = `form-feedback ${error ? 'is-error' : 'is-success'}`;
  feedback.textContent = message;
}

function clearEditorFeedback() {
  const feedback = document.getElementById('editorFeedback');
  if (!feedback) return;

  feedback.hidden = true;
  feedback.textContent = '';
  feedback.className = 'form-feedback';
}

function configureAnnouncementValidation(form) {
  const fields = [
    ['title', 'titleError', 'Enter an announcement title.'],
    ['body', 'bodyError', 'Enter an announcement message.'],
  ];

  const validate = (field, errorId, message) => {
    const wrapper = field.closest('.field');
    const error = document.getElementById(errorId);
    const invalid = !field.validity.valid;

    wrapper?.classList.toggle('is-invalid', invalid);
    field.setAttribute('aria-invalid', String(invalid));
    if (error) error.textContent = invalid ? message : '';
    return !invalid;
  };

  fields.forEach(([fieldId, errorId, message]) => {
    const field = form.elements[fieldId];
    field.addEventListener('invalid', event => {
      event.preventDefault();
      validate(field, errorId, message);
    });
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validate(field, errorId, message);
    });
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      fields.forEach(([fieldId, errorId]) => {
        const field = form.elements[fieldId];
        field.closest('.field')?.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
        document.getElementById(errorId).textContent = '';
      });
      clearEditorFeedback();
    });
  });
}

function datetimeForInput(value) {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
}

function fillEditor(form, page, record) {
  form.reset();
  const primaryKey = ADMIN_RECORDS[page].id;

  for (const field of form.elements) {
    if (!field.name) continue;
    const value = field.name === 'id' ? record[primaryKey] : record[field.name];
    if (value === undefined) continue;

    field.value = field.type === 'datetime-local'
      ? datetimeForInput(value)
      : value ?? '';
  }

  document.getElementById('formTitle').textContent = `Edit ${record.train_number || record.name || record.title || 'record'}`;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function recordActions(page, record, isAdmin, form, reload) {
  const actions = PIS.el('div', '', 'acts');
  const primaryKey = ADMIN_RECORDS[page].id;

  actions.append(PIS.button('Edit', () => fillEditor(form, page, record)));

  if (isAdmin && page !== 'updates') {
    actions.append(PIS.button('Delete', async () => {
      const warning = 'Delete this record? Linked station/train records must be made inactive or retired instead.';
      if (!window.confirm(warning)) return;

      const result = await PIS.api(operationEndpoint(page), {
        action: 'delete',
        id: record[primaryKey],
      });

      PIS.notice(result.message);
      await reload();
    }, true));
  }

  return actions;
}

async function loadLookupOptions(page) {
  const [lines, stations, trains] = await Promise.all([
    PIS.api('routes.php'),
    PIS.api('stations.php'),
    PIS.api('trains.php'),
  ]);

  PIS.options('line_id', lines.data, 'line_id', 'name', page === 'stations' ? 'No line' : undefined);
  PIS.options('station_id', stations.data, 'station_id', 'name', page === 'announcements' ? 'All stations' : undefined);
  PIS.options('train_id', trains.data, 'train_id', 'train_number');
}

async function startDashboard(isAdmin) {
  const load = async () => {
    const [dashboard, messages] = await Promise.all([
      PIS.api('dashboard.php'),
      PIS.api('messages.php'),
    ]);

    PIS.stats(dashboard.data.stats);
    PIS.table('recent', [
      ['train_number', 'Train'],
      [row => formatRecordValue(row.status), 'Journey status'],
      ['delay_min', 'Delay'],
      ['fetched_at', 'Updated'],
    ], dashboard.data.recent, null, 'simple-table admin-table admin-table-dashboard');

    document.getElementById('auditCard').hidden = !isAdmin;
    if (isAdmin) {
      PIS.table('audit', [
        ['created_at', 'Time'],
        ['user_name', 'User'],
        [row => formatRecordValue(row.action), 'Action'],
        [row => formatRecordValue(row.entity), 'Entity'],
        ['details', 'Details'],
      ], dashboard.data.audit, null, 'simple-table admin-table admin-table-audit');
    }

    renderMessages(messages.data, isAdmin, load);
  };

  document.getElementById('markAll').onclick = async () => {
    try {
      await PIS.api('messages.php', { action: 'mark_all_read' });
      await load();
    } catch (error) {
      PIS.notice(error.message, true);
    }
  };

  document.getElementById('messageFilter').onchange = load;
  await load();
}

function renderMessages(messages, isAdmin, reload) {
  const filter = document.getElementById('messageFilter').value;
  const visibleMessages = messages.filter(message => filter === '' || String(message.is_read) === filter);
  const container = document.getElementById('messages');

  container.replaceChildren();
  if (!visibleMessages.length) container.append(PIS.el('p', 'No messages.'));

  visibleMessages.forEach(message => {
    const card = PIS.el('article', '', 'card');
    const isRead = Number(message.is_read) === 1;

    card.append(
      PIS.el('span', isRead ? 'Read' : 'Unread', 'pill pill-info'),
      PIS.el('h3', message.subject),
      PIS.el('p', message.body),
      PIS.el('p', `${message.name} · ${message.email} · ${message.created_at}`, 'muted'),
      PIS.button(isRead ? 'Mark unread' : 'Mark read', async () => {
        await PIS.api('messages.php', {
          action: isRead ? 'mark_unread' : 'mark_read',
          id: message.message_id,
        });
        await reload();
      }),
    );

    if (isAdmin) {
      card.append(PIS.button('Delete', async () => {
        if (!window.confirm('Permanently delete this message?')) return;
        await PIS.api('messages.php', { action: 'delete', id: message.message_id });
        await reload();
      }, true));
    }

    container.append(card);
  });
}

async function startRecordManager(page, isAdmin) {
  const form = document.getElementById('editor');
  const config = ADMIN_RECORDS[page];
  const editable = isAdmin || ['announcements', 'updates'].includes(page);

  await loadLookupOptions(page);
  document.getElementById('editorCard').hidden = !editable;

  if (page === 'announcements') configureAnnouncementValidation(form);

  if (page === 'updates') {
    form.elements.delay_min.value = '0';
    document.getElementById('demoCard').hidden = !isAdmin;
  }

  const reload = async () => {
    const suffix = page === 'announcements' ? '?all=1' : '';
    const result = await PIS.api(operationEndpoint(page) + suffix);

    PIS.table(
      'records',
      config.columns,
      result.data,
      editable ? record => recordActions(page, record, isAdmin, form, reload) : null,
      `simple-table admin-table admin-table-${page}`,
    );
  };

  form.addEventListener('reset', () => resetEditor(form, page));
  PIS.bindForm('editor', async data => {
    try {
      const result = await PIS.api(operationEndpoint(page), { ...data, action: 'save' });
      form.reset();
      await reload();

      if (page === 'announcements') {
        await Announcements.refresh();
        setEditorFeedback(result.message);
      }
      PIS.notice(result.message);
    } catch (error) {
      if (page === 'announcements') setEditorFeedback(error.message, true);
      throw error;
    }
  });

  document.getElementById('importDemo')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;

    try {
      const result = await PIS.api('demo_feed.php', { action: 'import' });
      PIS.notice(result.message);
      await reload();
    } catch (error) {
      PIS.notice(error.message, true);
    } finally {
      event.currentTarget.disabled = false;
    }
  });

  await reload();
}
async function startAdmin() {
    if (PIS.page === 'login') {

        // Skip login form if session is already active.
        if (PIS.user) {
            window.location.replace('dashboard.html');
            return;
        }

        // Existing login form handler continues below.
        PIS.bindForm('loginForm', async data => {

    PIS.bindForm('loginForm', async data => {
      const result = await PIS.api('auth.php', { ...data, action: 'login' });
      PIS.csrf = result.data.csrf;
      location.href = 'dashboard.html';
    });
    return;
  }

  if (!PIS.user) {
    location.href = 'login.html';
    return;
  }

  document.getElementById('pageContent').hidden = false;
  document.getElementById('identity').textContent = `${PIS.user.name} (${PIS.user.role})`;
  document.getElementById('logout').addEventListener('click', async () => {
    try {
      await PIS.api('auth.php', { action: 'logout' });
      location.href = 'login.html';
    } catch (error) {
      PIS.notice(error.message, true);
    }
  });

  const isAdmin = PIS.user.role === 'admin';
  if (PIS.page === 'dashboard') return startDashboard(isAdmin);
  return startRecordManager(PIS.page, isAdmin);
}
