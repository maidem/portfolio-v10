<?php
/**
 * One-time DB seed importer for Docker container startup.
 * Called by docker-entrypoint.sh on first container start.
 * Reads env vars set by Coolify/Docker for DB connection.
 * Uses mysqli::multi_query() which correctly handles full mysqldump output.
 */

$host = getenv('TYPO3_DATABASE_HOST') ?: 'db';
$port = (int)(getenv('TYPO3_DATABASE_PORT') ?: 3306);
$user = getenv('TYPO3_DATABASE_USERNAME') ?: 'db';
$pass = getenv('TYPO3_DATABASE_PASSWORD') ?: 'db';
$name = getenv('TYPO3_DATABASE_NAME') ?: 'db';

echo "[importer] Connecting to $host:$port/$name as $user\n";

$mysqli = new mysqli($host, $user, $pass, $name, $port);
if ($mysqli->connect_error) {
    echo "[importer] ERROR: Cannot connect to DB: " . $mysqli->connect_error . "\n";
    exit(1);
}
$mysqli->set_charset('utf8mb4');

$sqlFile = __DIR__ . '/seed.sql';
if (!file_exists($sqlFile)) {
    echo "[importer] ERROR: seed.sql not found at $sqlFile\n";
    exit(1);
}

echo "[importer] Reading SQL from $sqlFile (" . number_format(filesize($sqlFile)) . " bytes)\n";

$sql = file_get_contents($sqlFile);

// mysqli::multi_query correctly handles full mysqldump output including
// multi-line CREATE TABLE, multi-row INSERT, and /*!... */ comments.
if ($mysqli->multi_query($sql)) {
    $count = 0;
    do {
        $count++;
        // Free any result sets (SELECT statements in dumps)
        if ($result = $mysqli->store_result()) {
            $result->free();
        }
    } while ($mysqli->more_results() && $mysqli->next_result());

    if ($mysqli->errno) {
        echo "[importer] ERROR after $count statements: " . $mysqli->error . "\n";
        exit(1);
    }

    echo "[importer] Done: $count statements executed successfully.\n";
} else {
    echo "[importer] ERROR: multi_query failed: " . $mysqli->error . "\n";
    exit(1);
}

$mysqli->close();
exit(0);
