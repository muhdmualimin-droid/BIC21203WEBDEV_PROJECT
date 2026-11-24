<?php
function respond($data = null, string $message = 'OK', int $code = 200): never {
    http_response_code($code);
    echo json_encode(['success'=>$code < 400, 'message'=>$message, 'data'=>$data], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function fail(string $message, int $code = 422): never { respond(null, $message, $code); }
function input(): array {
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 65536) fail('Request too large.', 413);
    try { $data = json_decode(file_get_contents('php://input'), true, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException $e) { fail('Send a valid JSON object.', 400); }
    if (!is_array($data) || array_is_list($data) && $data !== []) fail('Send a JSON object.', 400);
    return $data;
}
