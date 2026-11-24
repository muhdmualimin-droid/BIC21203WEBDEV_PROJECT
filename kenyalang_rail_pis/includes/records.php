<?php
// Shared CRUD handler for stations, trains and announcements.
// The entity name is assigned only by the three API endpoint files.
$primaryKeys = [
    'stations' => 'station_id',
    'trains' => 'train_id',
    'announcements' => 'ann_id',
];

if (!isset($primaryKeys[$entity])) fail('Unknown records module.', 404);
$primaryKey = $primaryKeys[$entity];

function record_payload(string $entity, array $data, int $userId, bool $isNew): array
{
    return match ($entity) {
        'stations' => station_payload($data),
        'trains' => train_payload($data),
        'announcements' => announcement_payload($data, $userId, $isNew),
    };
}

function station_payload(array $data): array
{
    $payload = [
        'code' => text_value($data, 'code', 10),
        'name' => text_value($data, 'name', 120),
        'zone' => text_value($data, 'zone', 3, false),
        'line_id' => reference($data['line_id'] ?? null, 'rail_lines', 'line_id', true),
        'facilities' => text_value($data, 'facilities', 255, false),
        'is_active' => number_value($data['is_active'] ?? 1, 'active', 0, 1),
    ];

    foreach (['latitude' => 90, 'longitude' => 180] as $field => $limit) {
        $value = $data[$field] ?? '';
        if ($value !== '' && $value !== null && (!is_numeric($value) || abs((float) $value) > $limit)) {
            fail("Invalid {$field}.");
        }
        $payload[$field] = $value === '' || $value === null ? null : (float) $value;
    }

    return $payload;
}

function train_payload(array $data): array
{
    return [
        'train_number' => text_value($data, 'train_number', 20),
        'line_id' => reference($data['line_id'] ?? null, 'rail_lines', 'line_id'),
        'train_type' => choice($data['train_type'] ?? '', ['Komuter', 'ETS', 'Intercity', 'Shuttle'], 'train type'),
        'direction' => choice($data['direction'] ?? '', ['northbound', 'southbound'], 'direction'),
        'capacity' => number_value($data['capacity'] ?? null, 'capacity', 1, 65535),
        'status' => choice($data['status'] ?? '', ['active', 'maintenance', 'retired'], 'operational condition'),
    ];
}

function announcement_payload(array $data, int $userId, bool $isNew): array
{
    $payload = [
        'title' => text_value($data, 'title', 150),
        'body' => text_value($data, 'body', 10000),
        'type' => choice($data['type'] ?? '', ['info', 'delay', 'alert'], 'announcement type'),
        'station_id' => reference($data['station_id'] ?? null, 'stations', 'station_id', true),
        'expires_at' => date_value($data['expires_at'] ?? null),
    ];

    if ($isNew) $payload['published_by'] = $userId;
    return $payload;
}

function has_related_records(string $entity, int $id): bool
{
    return match ($entity) {
        'trains' => (bool) query('SELECT COUNT(*) FROM timetable WHERE train_id = ?', [$id])->fetchColumn()
            || (bool) query('SELECT COUNT(*) FROM live_updates WHERE train_id = ?', [$id])->fetchColumn(),
        'stations' => (bool) query('SELECT COUNT(*) FROM timetable WHERE station_id = ?', [$id])->fetchColumn()
            || (bool) query('SELECT COUNT(*) FROM live_updates WHERE station_id = ?', [$id])->fetchColumn()
            || (bool) query('SELECT COUNT(*) FROM announcements WHERE station_id = ?', [$id])->fetchColumn(),
        default => false,
    };
}

function related_record_message(string $entity): string
{
    return $entity === 'trains'
        ? 'This train has timetable or journey records. Set its condition to retired instead.'
        : 'This station has related records. Set it inactive instead.';
}

if ($method === 'GET') {
    if ($entity === 'announcements') {
        $includeInactive = ($_GET['all'] ?? '') === '1';
        if ($includeInactive) protect();

        $where = $includeInactive ? '' : ' WHERE a.expires_at IS NULL OR a.expires_at > NOW()';
        respond(query(
            'SELECT a.*, s.name AS station_name FROM announcements a '
            . 'LEFT JOIN stations s ON s.station_id = a.station_id'
            . $where
            . ' ORDER BY a.created_at DESC, a.ann_id DESC'
        )->fetchAll());
    }

    respond(query("SELECT * FROM {$entity} ORDER BY {$primaryKey}")->fetchAll());
}

$user = protect();
$data = input();
$action = choice($data['action'] ?? 'save', ['save', 'delete'], 'action');

if ($entity !== 'announcements' || $action === 'delete') protect(true);

$id = number_value($data['id'] ?? 0, 'record ID', 0);
db()->beginTransaction();

if ($id && !query("SELECT {$primaryKey} FROM {$entity} WHERE {$primaryKey} = ? FOR UPDATE", [$id])->fetch()) {
    fail('Record not found.', 404);
}

if ($action === 'delete') {
    if (!$id) fail('Select a record.');
    if (has_related_records($entity, $id)) fail(related_record_message($entity), 409);

    query("DELETE FROM {$entity} WHERE {$primaryKey} = ?", [$id]);
} else {
    $payload = record_payload($entity, $data, (int) $user['user_id'], $id === 0);

    if ($id) {
        $assignments = implode(', ', array_map(fn (string $key): string => "{$key} = ?", array_keys($payload)));
        query("UPDATE {$entity} SET {$assignments} WHERE {$primaryKey} = ?", [...array_values($payload), $id]);
    } else {
        $fields = implode(', ', array_keys($payload));
        $placeholders = implode(', ', array_fill(0, count($payload), '?'));
        query("INSERT INTO {$entity} ({$fields}) VALUES ({$placeholders})", array_values($payload));
        $id = (int) db()->lastInsertId();
    }
}

audit($action, $entity, "id={$id}");
db()->commit();

respond(['id' => $id], $action === 'delete' ? 'Record deleted.' : 'Record saved.');
