<?php
// CLI only. Refuses every existing database, including empty ones.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__.'/../config/config.php';
require __DIR__.'/sql_parser.php';
if (!preg_match('/^[a-zA-Z0-9_]+$/',DB_NAME)) exit("Invalid database name.\n");
$admin=getenv('PIS_ADMIN_PASSWORD') ?: '';
$staff=getenv('PIS_STAFF_PASSWORD') ?: '';
if (strlen($admin)<12 || strlen($staff)<12) exit("Set PIS_ADMIN_PASSWORD and PIS_STAFF_PASSWORD to distinct passwords of at least 12 characters.\n");
if ($admin===$staff) exit("Choose different account passwords.\n");
try {
    $pdo=new PDO('mysql:host='.DB_HOST.';port='.DB_PORT.';charset=utf8mb4',DB_USER,DB_PASS,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $check=$pdo->prepare('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME=?');$check->execute([DB_NAME]);
    if ($check->fetch()) { fwrite(STDERR,"Database already exists. Nothing changed. Use docs/SETUP.md migration steps.\n");exit(1); }
    $pdo->exec('CREATE DATABASE `'.DB_NAME.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo->exec('USE `'.DB_NAME.'`'); $pdo->exec("SET time_zone='+08:00'");
    foreach(sql_statements(file_get_contents(__DIR__.'/../sql/schema.sql')) as $s) $pdo->exec($s);
    $pdo->beginTransaction();
    $q=$pdo->prepare('INSERT INTO users (user_id,name,email,password_hash,role) VALUES (?,?,?,?,?)');
    $q->execute([1,'System Administrator','admin@pis.local',password_hash($admin,PASSWORD_DEFAULT),'admin']);
    $q->execute([2,'Nurul Aisyah','staff@pis.local',password_hash($staff,PASSWORD_DEFAULT),'staff']);
    $q->execute([3,'Demo Staff','demo.staff@kenyalang.local',password_hash('DemoStaff!2026',PASSWORD_DEFAULT),'staff']);
    $q->execute([4,'Demo Administrator','demo.admin@kenyalang.local',password_hash('DemoAdmin!2026',PASSWORD_DEFAULT),'admin']);
    foreach(sql_statements(file_get_contents(__DIR__.'/../sql/seed.sql')) as $s) $pdo->exec($s);
    $pdo->commit();echo "Fresh installation complete. Demo routes and articles are educational samples.\n";
} catch(Throwable $e) {
    if(isset($pdo) && $pdo->inTransaction())$pdo->rollBack();
    fwrite(STDERR,"Installation stopped: ".$e->getMessage()."\nAny partially created database is retained for inspection; it is never automatically deleted.\n");exit(1);
}
