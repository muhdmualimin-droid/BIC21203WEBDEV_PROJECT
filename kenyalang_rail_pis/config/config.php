<?php
declare(strict_types=1);
// XAMPP defaults. Environment overrides allow an isolated test database.
define('DB_HOST', getenv('PIS_DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('PIS_DB_PORT') ?: '3306');
define('DB_NAME', getenv('PIS_DB_NAME') ?: 'pis_railway');
define('DB_USER', getenv('PIS_DB_USER') ?: 'root');
define('DB_PASS', getenv('PIS_DB_PASS') ?: '');
date_default_timezone_set('Asia/Kuala_Lumpur');
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
