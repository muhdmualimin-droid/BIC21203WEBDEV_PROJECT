'use strict';

/* News & Media page (Member 4)
 *
 * "Try the station announcement": reads the button's data-speak text aloud
 * with the browser's Web Speech API (text-to-speech), the same idea as the
 * Automated Audio Broadcast Module in the project brief.
 */
(function () {
  const buttons = document.querySelectorAll('[data-speak]');
  const status = document.getElementById('speakStatus');
  if (!buttons.length) return;

  const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  buttons.forEach(button => {
    if (!supported) {
      button.disabled = true;
      if (status) status.textContent = 'This browser does not support text-to-speech.';
      return;
    }

    button.addEventListener('click', () => {
      // The HTML attribute spans two lines; collapse the extra spaces.
      const text = button.dataset.speak.replace(/\s+/g, ' ').trim();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-MY';
      utterance.rate = 0.95;
      utterance.onstart = () => { if (status) status.textContent = 'Playing announcement...'; };
      utterance.onend = () => { if (status) status.textContent = ''; };
      utterance.onerror = () => {
        if (status) status.textContent = 'Speech could not play. Check your sound settings.';
      };

      speechSynthesis.cancel();      // stop anything already playing
      speechSynthesis.speak(utterance);
    });
  });
}());
