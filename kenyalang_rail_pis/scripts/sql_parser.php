<?php
function sql_statements(string $sql): array
{
    $statements = [];
    $current = '';
    $inString = false;
    $quote = '';
    $length = strlen($sql);

    for ($i = 0; $i < $length; $i++) {
        $char = $sql[$i];

        if ($inString) {
            $current .= $char;
            if ($char === '\\') {
                $current .= $sql[$i + 1] ?? '';
                $i++;
                continue;
            }
            if ($char === $quote) {
                if (($sql[$i + 1] ?? '') === $quote) {
                    $current .= $sql[$i + 1];
                    $i++;
                    continue;
                }
                $inString = false;
            }
            continue;
        }

        if ($char === "'" || $char === '"' || $char === '`') {
            $inString = true;
            $quote = $char;
            $current .= $char;
            continue;
        }

        if ($char === '-' && ($sql[$i + 1] ?? '') === '-') {
            while ($i < $length && $sql[$i] !== "\n") {
                $i++;
            }
            continue;
        }

        if ($char === ';') {
            if (trim($current) !== '') {
                $statements[] = trim($current);
            }
            $current = '';
            continue;
        }

        $current .= $char;
    }

    if (trim($current) !== '') {
        $statements[] = trim($current);
    }

    return $statements;
}

