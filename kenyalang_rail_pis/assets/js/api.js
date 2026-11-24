'use strict';

const PIS = {
  base: document.body.dataset.base,
  page: document.body.dataset.page,
  isAdmin: document.body.dataset.admin === 'true',
  csrf: '',
  user: null,

  async api(endpoint, data) {
    const isReadRequest = data === undefined;
    const response = await fetch(this.base + 'api/' + endpoint, {
      method: isReadRequest ? 'GET' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: isReadRequest ? {} : {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrf,
      },
      body: isReadRequest ? undefined : JSON.stringify(data),
      signal: AbortSignal.timeout(12000),
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('Invalid server response. Open this site through PHP / XAMPP.');
    }

    if (!response.ok || !result.success) {
      if (response.status === 401 && this.isAdmin && this.page !== 'login') {
        location.href = 'login.html';
      }
      throw new Error(result.message || 'Request failed.');
    }

    return result;
  },

  notice(message, error = false) {
    const notice = document.getElementById('notice');
    notice.hidden = false;
    notice.className = 'flash ' + (error ? 'flash-error' : 'flash-success');
    notice.textContent = message;
  },

  el(tag, text = '', className = '') {
    const element = document.createElement(tag);
    element.textContent = text ?? 'Not available';
    element.className = className;
    return element;
  },

  button(label, callback, danger = false) {
    const button = this.el(
      'button',
      label,
      'btn btn-sm ' + (danger ? 'btn-danger' : 'btn-ghost'),
    );
    button.type = 'button';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await callback();
      } catch (error) {
        this.notice(error.message, true);
      } finally {
        button.disabled = false;
      }
    });
    return button;
  },

  table(target, columns, rows, actions = null, tableClass = 'simple-table') {
    const container = typeof target === 'string'
      ? document.getElementById(target)
      : target;
    container.replaceChildren();

    if (!rows.length) {
      container.append(this.el('p', 'No records match the current filters.', 'empty-state'));
      return;
    }

    const scroll = this.el('div', '', 'table-scroll');
    const table = this.el('table', '', tableClass);
    const caption = this.el('caption', 'Records', 'visually-hidden');
    const head = this.el('thead');
    const headerRow = this.el('tr');
    const body = this.el('tbody');
    const headers = [
      ...columns.map(([, label]) => label),
      ...(actions ? ['Actions'] : []),
    ];

    headers.forEach(label => {
      const header = this.el('th', label);
      header.scope = 'col';
      headerRow.append(header);
    });

    head.append(headerRow);
    table.append(caption, head);

    rows.forEach(row => {
      const tableRow = this.el('tr');
      columns.forEach(([key]) => {
        const cell = this.el('td');
        const value = typeof key === 'function' ? key(row) : row[key];
        if (value instanceof Node) {
          cell.append(value);
        } else {
          cell.textContent = value ?? 'Not available';
        }
        tableRow.append(cell);
      });

      if (actions) {
        const actionCell = this.el('td');
        actionCell.append(actions(row));
        tableRow.append(actionCell);
      }
      body.append(tableRow);
    });

    table.append(body);
    scroll.append(table);
    container.append(scroll);
  },

  skeleton(target, rows = 4, columns = 4) {
    const container = typeof target === 'string'
      ? document.getElementById(target)
      : target;
    if (!container) return;

    const block = this.el('div', '', 'skeleton-table');
    block.setAttribute('aria-hidden', 'true');
    for (let row = 0; row < rows; row += 1) {
      const line = this.el('div', '', 'skeleton-row');
      for (let column = 0; column < columns; column += 1) {
        line.append(this.el('span', '', 'skeleton'));
      }
      block.append(line);
    }
    container.replaceChildren(block);
  },

  options(id, rows, key, label, emptyLabel) {
    const select = document.getElementById(id);
    if (!select) return;

    const previousValue = select.value;
    select.replaceChildren();
    if (emptyLabel !== undefined) select.add(new Option(emptyLabel, ''));
    rows.forEach(row => select.add(new Option(row[label], row[key])));
    if ([...select.options].some(option => option.value === previousValue)) {
      select.value = previousValue;
    }
  },

  stats(data) {
    const box = document.getElementById('stats');
    if (!box) return;

    const signature = JSON.stringify(data);
    if (box.dataset.signature === signature) return;
    box.dataset.signature = signature;

    const labels = {
      active_trains: 'Active trains',
      live_updates: 'Journey reports',
      users: 'Accounts',
      delayed: 'Delayed trains',
    };

    box.replaceChildren();
    Object.entries(data).forEach(([key, value]) => {
      const card = this.el('div', '', 'stat card');
      card.append(
        this.el('span', value, 'stat-n'),
        this.el('span', labels[key] || key.replaceAll('_', ' '), 'stat-l'),
      );
      box.append(card);
    });
  },

  bindForm(id, callback) {
    const form = document.getElementById(id);
    if (!form) return;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = form.querySelector('[type=submit]');
      submit.disabled = true;
      try {
        await callback(Object.fromEntries(new FormData(form)), form);
      } catch (error) {
        this.notice(error.message, true);
      } finally {
        submit.disabled = false;
      }
    });
  },
};
