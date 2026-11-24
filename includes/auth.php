<?php
ini_set('session.use_strict_mode', '1');
session_name('KENYALANG_V2');
session_set_cookie_params(['httponly'=>true, 'secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'samesite'=>'Lax', 'path'=>'/']);
session_start();
if (isset($_SESSION['user_id']) && time() - ($_SESSION['last_activity'] ?? 0) > 3600) {
    $_SESSION = [];
    session_regenerate_id(true);
}
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
function user(): ?array {
    if (empty($_SESSION['user_id'])) return null;
    return query('SELECT user_id, name, email, role FROM users WHERE user_id=? AND is_active=1', [$_SESSION['user_id']])->fetch() ?: null;
}
function protect(bool $admin = false): array {
    $u = user();
    if (!$u) fail('Please sign in.', 401);
    if ($admin && $u['role'] !== 'admin') fail('Administrator permission required.', 403);
    $_SESSION['last_activity'] = time();
    return $u;
}
function csrf(): void {
    if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) fail('Session token expired. Reload this page.', 419);
}
function audit(string $action, string $entity, string $details = ''): void {
    query('INSERT INTO audit_log (user_id,action,entity,details,ip_address) VALUES (?,?,?,?,?)', [$_SESSION['user_id'] ?? null,$action,$entity,mb_substr($details,0,255),$_SERVER['REMOTE_ADDR'] ?? null]);
}
