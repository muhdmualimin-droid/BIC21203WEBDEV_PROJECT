'use strict';

/* Contact page (Member 4)
 *
 * 1. Client-side validation: checks each field in the browser and shows the
 *    message under it, so visitors see mistakes at once. api/contact.php checks
 *    the same rules again, because JavaScript can be switched off.
 * 2. Sends the form as JSON with PIS.api() (fetch + CSRF token header).
 * 3. Pre-selects the topic from the address bar, e.g. contact.html?topic=accessibility.
 */
(function () {
  const form = document.getElementById('contactMessageForm');
  if (!form) return;

  const status = document.getElementById('contactStatus');
  const body = document.getElementById('body');
  const counter = document.getElementById('bodyCount');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // One rule per field id: return an error message, or '' when the value is fine.
  // The messages match the ones in api/contact.php.
  const rules = {
    topic: value => (value === '' ? 'Please choose a topic.' : ''),
    name: value => (value === '' || value.length > 100 ? 'Please enter your name (max 100 characters).' : ''),
    email: value => (!emailPattern.test(value) || value.length > 150 ? 'Please enter a valid email address.' : ''),
    subject: value => (value === '' || value.length > 130 ? 'Please enter a subject (max 130 characters).' : ''),
    body: value => (value.length < 10 || value.length > 5000 ? 'Please write a message between 10 and 5000 characters.' : ''),
  };
  const fields = Object.keys(rules).map(id => document.getElementById(id));

  function showStatus(message, isError) {
    status.hidden = false;
    status.className = 'flash ' + (isError ? 'flash-error' : 'flash-success');
    status.setAttribute('role', isError ? 'alert' : 'status');
    status.textContent = message;               // textContent: never parsed as HTML
    status.scrollIntoView({ block: 'center', behavior: 'smooth' });
    status.focus({ preventScroll: true });       // keyboard and screen-reader users land on it too
  }

  // Show or clear the message under one field, and tell screen readers about it.
  function setError(field, message) {
    const error = document.getElementById(field.id + '-error');
    const described = (field.getAttribute('aria-describedby') || '')
      .split(' ')
      .filter(id => id && id !== error.id);

    error.textContent = message;
    error.hidden = message === '';
    if (message) {
      field.setAttribute('aria-invalid', 'true');
      described.push(error.id);
    } else {
      field.removeAttribute('aria-invalid');
    }

    if (described.length) field.setAttribute('aria-describedby', described.join(' '));
    else field.removeAttribute('aria-describedby');
  }

  function check(field) {
    const message = rules[field.id](field.value.trim());
    setError(field, message);
    return message === '';
  }

  function updateCounter() {
    counter.textContent = body.value.length + ' / 5000 characters';
  }

  // Topic from the URL (GET parameter), only if it is one of the options.
  const linkedTopic = new URLSearchParams(location.search).get('topic');
  const topic = document.getElementById('topic');
  if ([...topic.options].some(option => option.value && option.value === linkedTopic)) {
    topic.value = linkedTopic;
  }

  fields.forEach(field => {
    // Check a field when the visitor leaves it...
    field.addEventListener('blur', () => {
      if (field.value.trim() !== '') check(field);
    });
    // ...and clear its error as soon as it is fixed.
    field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (field.getAttribute('aria-invalid') === 'true') check(field);
    });
  });
  body.addEventListener('input', updateCounter);
  updateCounter();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.hidden = true;

    // Check every field; stop and focus the first mistake.
    const firstInvalid = fields.filter(field => !check(field))[0];
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const submit = form.querySelector('[type=submit]');
    submit.disabled = true;
    try {
      // { topic, name, email, subject, body, website } -> JSON -> api/contact.php
      const result = await PIS.api('contact.php', Object.fromEntries(new FormData(form)));
      showStatus(result.message, false);
      form.reset();
      updateCounter();
    } catch (error) {
      showStatus(error.message, true);
    } finally {
      submit.disabled = false;
    }
  });
}());
