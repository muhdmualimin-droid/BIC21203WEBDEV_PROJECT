<?php

/** Return a bounded, trimmed text value from a JSON request. */
function text_value(array $data, string $key, int $maxLength, bool $required = true): ?string
{
    $value = $data[$key] ?? '';
    if (!is_string($value)) fail("Invalid {$key}.");

    $value = trim($value);
    if (($required && $value === '') || mb_strlen($value) > $maxLength) {
        fail("{$key} is required and must be at most {$maxLength} characters.");
    }

    return $value === '' && !$required ? null : $value;
}

/** Return a whole number within a fixed range. */
function number_value(mixed $value, string $name, int $min = 1, int $max = PHP_INT_MAX): int
{
    if (filter_var($value, FILTER_VALIDATE_INT) === false || $value < $min || $value > $max) {
        fail("Invalid {$name}.");
    }
    return (int) $value;
}

/** Ensure that a submitted value belongs to an approved list. */
function choice(mixed $value, array $choices, string $name): string
{
    if (!is_string($value) || !in_array($value, $choices, true)) fail("Invalid {$name}.");
    return $value;
}

/** Normalise a datetime-local value into MySQL DATETIME format. */
function date_value(mixed $value): ?string
{
    if ($value === null || $value === '') return null;
    if (!is_string($value)) fail('Invalid date and time.');

    $value = str_replace('T', ' ', $value);
    $value = strlen($value) === 16 ? "{$value}:00" : $value;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $value);

    if (!$date || $date->format('Y-m-d H:i:s') !== $value) fail('Invalid date and time.');
    return $value;
}

/** Verify an ID exists in an application-owned table definition. */
function reference(mixed $value, string $table, string $primaryKey, bool $optional = false): ?int
{
    if ($optional && ($value === null || $value === '')) return null;

    $id = number_value($value, $primaryKey);
    $record = query("SELECT {$primaryKey} FROM {$table} WHERE {$primaryKey} = ?", [$id])->fetch();
    if (!$record) fail("Selected {$table} record does not exist.");

    return $id;
}

/** Read current reports, or every train when status search needs them. */
function departures(bool $includeTrainsWithoutReports = false): array
{
    $filter = $includeTrainsWithoutReports ? '' : ' WHERE u.update_id IS NOT NULL';

    return query(
        'SELECT u.*, t.train_id, t.train_number, t.direction, t.line_id, '
        . 't.status AS operational_status, l.name AS line_name, '
        . 's.name AS station_name, tt.departure AS scheduled_time '
        . 'FROM trains t '
        . 'LEFT JOIN live_updates u ON t.train_id = u.train_id '
        . 'JOIN rail_lines l ON l.line_id = t.line_id '
        . 'LEFT JOIN stations s ON s.station_id = u.station_id '
        . 'LEFT JOIN timetable tt ON tt.train_id = u.train_id AND tt.station_id = u.station_id '
        . $filter
        . ' ORDER BY u.eta IS NULL, u.eta, t.train_number'
    )->fetchAll();
}

/** Save a staff report, or a protected local-demo record. Call inside a transaction. */
function save_update(array $data, bool $isDemo = false): bool
{
    $trainId = reference($data['train_id'] ?? null, 'trains', 'train_id');
    $stationId = reference($data['station_id'] ?? null, 'stations', 'station_id');
    $status = choice($data['status'] ?? '', ['on_time', 'delayed', 'cancelled', 'arriving'], 'journey status');
    $delayMinutes = number_value($data['delay_min'] ?? 0, 'delay minutes', 0, 1440);

    if ($status !== 'delayed' && $delayMinutes !== 0) fail('Delay must be zero unless the journey is delayed.');

    $eta = date_value($data['eta'] ?? null);
    query('SELECT train_id FROM trains WHERE train_id = ? FOR UPDATE', [$trainId]);
    $previous = query('SELECT * FROM live_updates WHERE train_id = ? FOR UPDATE', [$trainId])->fetch();

    if ($isDemo && $previous && $previous['source_api'] !== 'local_demo') return false;

    $source = $isDemo ? 'local_demo' : 'staff_manual';
    query(
        'INSERT INTO live_updates '
        . '(train_id, station_id, status, delay_min, eta, source_api, is_simulated, fetched_at) '
        . 'VALUES (?, ?, ?, ?, ?, ?, ?, NOW()) '
        . 'ON DUPLICATE KEY UPDATE '
        . 'station_id = VALUES(station_id), status = VALUES(status), '
        . 'delay_min = VALUES(delay_min), eta = VALUES(eta), '
        . 'source_api = VALUES(source_api), is_simulated = VALUES(is_simulated), fetched_at = NOW()',
        [$trainId, $stationId, $status, $delayMinutes, $eta, $source, $isDemo ? 1 : 0]
    );

    audit('update', 'live_updates', json_encode([
        'train' => $trainId,
        'before' => $previous ? [$previous['status'], $previous['delay_min'], $previous['station_id'], $previous['eta']] : null,
        'after' => [$status, $delayMinutes, $stationId, $eta],
        'source' => $source,
    ]));

    return true;
}
