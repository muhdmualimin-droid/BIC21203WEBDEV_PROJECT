<?php

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

set_exception_handler(function (Throwable $error): never {
    error_log('[Kenyalang V2] ' . $error->getMessage());

    if ($error instanceof PDOException && $error->getCode() === '23000') {
        fail('This record conflicts with existing or related data.', 409);
    }

    fail('The service is unavailable. Check database setup and the server log.', 503);
});

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    fail('Method not allowed.', 405);
}

if ($method === 'POST') csrf();
