<?php
declare(strict_types=1);

// CLI-only helper for an existing local project database.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../config/config.php';

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
    );
    $statement = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), password_hash = VALUES(password_hash), role = VALUES(role),
           is_active = 1, failed_attempts = 0, locked_until = NULL',
    );
    $statement->execute([
        'Demo Staff',
        'demo.staff@Belang.local',
        password_hash('DemoStaff!2026', PASSWORD_DEFAULT),
        'staff',
    ]);
    $statement->execute([
        'Demo Administrator',
        'demo.admin@Belang.local',
        password_hash('DemoAdmin!2026', PASSWORD_DEFAULT),
        'admin',
    ]);
    echo "Demo staff and admin accounts are ready.\n";
} catch (Throwable $error) {
    fwrite(STDERR, 'Could not create the demo staff account: ' . $error->getMessage() . "\n");
    exit(1);
}
