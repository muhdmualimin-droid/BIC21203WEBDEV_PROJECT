'use strict';

function initialiseNavigation() {
  const button = document.querySelector('.nav-toggle');
  const navigation = document.getElementById('primary-nav');

  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(isOpen));
    navigation.classList.toggle('is-open', isOpen);
  });
}

async function initialiseFeatures() {
  const starts = PIS.isAdmin
    ? [startAdmin(), Announcements.start()]
    : [startPublic(), Announcements.start()];

  const results = await Promise.allSettled(starts);
  const failed = results.find(result => result.status === 'rejected');

  if (failed) PIS.notice(failed.reason.message, true);
}

async function initialisePage() {
  try {
    const session = await PIS.api('auth.php');
    PIS.csrf = session.data.csrf;
    PIS.user = session.data.user;

/* Session-aware Operations navigation */
const operationsLink = document.querySelector(
    ".primary-nav a.nav-btn"
);

if (operationsLink) {
    const isLoggedIn = PIS.user &&
        ["admin", "staff"].includes(PIS.user.role);

    operationsLink.href = PIS.base + (
        isLoggedIn
            ? "admin/dashboard.html"
            : "admin/login.html"
    );
}

    await initialiseFeatures();
  } catch (error) {
    PIS.notice(error.message, true);
  }
}

initialiseNavigation();
initialisePage();
