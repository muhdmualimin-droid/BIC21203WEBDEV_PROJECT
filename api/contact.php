<?php
/**
 * POST api/contact.php  (Member 4: Contact page)
 *
 * JSON body: {"topic", "name", "email", "subject", "body", "website"}
 * Creates one row in the `messages` table - the C in CRUD. Staff read, mark
 * and delete messages in the Operations dashboard (api/messages.php, sign-in required).
 *
 * includes/init.php already sends JSON headers, starts the session and checks
 * the X-CSRF-Token header on every POST. Database errors are caught by its
 * exception handler, which logs them and replies 503 without SQL details.
 */
require __DIR__.'/../includes/init.php';

/* Dropdown topics: key sent by the form => label saved with the subject. */
const CONTACT_TOPICS = [
    'data'          => 'Data problem',
    'accessibility' => 'Accessibility',
    'feedback'      => 'Feedback',
    'other'         => 'Other',
];
const CONTACT_SUBJECT_MAX    = 130; // leaves room for the "[Accessibility] " prefix in the 150-character column
const CONTACT_MAX_PER_WINDOW = 3;   // messages allowed from one IP address...
const CONTACT_WINDOW_MINUTES = 10;  // ...within this many minutes

if ($method !== 'POST') fail('Use POST.', 405);
$d = input();

/** Trimmed text from the JSON body; anything that is not a string is rejected. */
function contact_text(array $data, string $key): string
{
    $value = $data[$key] ?? '';
    if (!is_string($value)) fail('Invalid ' . $key . '.', 400);
    return trim($value);
}

// Honeypot: the "website" field is hidden from people, so only bots fill it in.
// Pretend it worked, but store nothing.
$trap = $d['website'] ?? '';
if (!is_string($trap) || trim($trap) !== '') {
    respond(null, 'Thank you. Your message has been received.', 201);
}

// Server-side validation. contact.js checks the same rules in the browser first,
// but JavaScript can be switched off, so the server never trusts it.
$topic   = contact_text($d, 'topic');
$name    = contact_text($d, 'name');
$email   = contact_text($d, 'email');
$subject = contact_text($d, 'subject');
$body    = contact_text($d, 'body');

if (!isset(CONTACT_TOPICS[$topic]))                             fail('Please choose a topic.');
if ($name === '' || mb_strlen($name) > 100)                     fail('Please enter your name (max 100 characters).');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) fail('Please enter a valid email address.');
if ($subject === '' || mb_strlen($subject) > CONTACT_SUBJECT_MAX) fail('Please enter a subject (max ' . CONTACT_SUBJECT_MAX . ' characters).');
if (mb_strlen($body) < 10 || mb_strlen($body) > 5000)           fail('Please write a message between 10 and 5000 characters.');

// Spam protection, two layers:
// 1) per browser session: one message every 20 seconds;
// 2) per IP address: a few messages per 10 minutes (survives clearing cookies).
if (time() - ($_SESSION['contact_at'] ?? 0) < 20) {
    fail('Please wait 20 seconds before sending another message.', 429);
}
$ip = $_SERVER['REMOTE_ADDR'] ?? null;
if ($ip !== null) {
    $recent = (int) query(
        'SELECT COUNT(*) FROM messages WHERE ip = ? AND created_at > (NOW() - INTERVAL '
        . CONTACT_WINDOW_MINUTES . ' MINUTE)',
        [$ip]
    )->fetchColumn();
    if ($recent >= CONTACT_MAX_PER_WINDOW) {
        fail('You have sent several messages recently. Please wait a few minutes and try again.', 429);
    }
}

// Prepared statement (query() uses prepare + execute): input never becomes part of the SQL text.
query(
    'INSERT INTO messages (name, email, subject, body, ip) VALUES (?, ?, ?, ?, ?)',
    [$name, $email, '[' . CONTACT_TOPICS[$topic] . '] ' . $subject, $body, $ip]
);
$reference = sprintf('MSG-%04d', (int) db()->lastInsertId());

$_SESSION['contact_at'] = time();
respond(
    ['reference' => $reference],
    'Thank you. Your message has been received. Reference: ' . $reference . '.',
    201
);
