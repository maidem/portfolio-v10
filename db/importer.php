<?php
/**
 * One-time DB seed importer for Docker container startup.
 * Called by docker-entrypoint.sh on first container start.
 * Reads env vars set by Coolify/Docker for DB connection.
 */

$host = getenv('TYPO3_DATABASE_HOST') ?: 'db';
$port = (int)(getenv('TYPO3_DATABASE_PORT') ?: 3306);
$user = getenv('TYPO3_DATABASE_USERNAME') ?: 'db';
$pass = getenv('TYPO3_DATABASE_PASSWORD') ?: 'db';
$name = getenv('TYPO3_DATABASE_NAME') ?: 'db';

echo "[importer] Connecting to $host:$port/$name as $user\n";

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    echo "[importer] ERROR: Cannot connect to DB: " . $e->getMessage() . "\n";
    exit(1);
}

$sqlFile = __DIR__ . '/seed.sql';
if (!file_exists($sqlFile)) {
    echo "[importer] ERROR: seed.sql not found at $sqlFile\n";
    exit(1);
}

echo "[importer] Reading SQL from $sqlFile (" . number_format(filesize($sqlFile)) . " bytes)\n";

$sql = file_get_contents($sqlFile);

// Split by statement terminator (handle multi-line statements)
$statements = [];
$current = '';
$inString = false;
$stringChar = '';

$lines = explode("\n", $sql);
foreach ($lines as $line) {
    // Skip comment-only lines
    if (preg_match('/^--/', $line) || trim($line) === '') {
        continue;
    }
    $current .= $line . "\n";
    // Simple heuristic: statement ends with ';' on a line
    if (preg_match('/;\s*$/', trim($line))) {
        $stmt = trim($current);
        if ($stmt) {
            $statements[] = $stmt;
        }
        $current = '';
    }
}

$success = 0;
$errors = 0;
foreach ($statements as $stmt) {
    try {
        $pdo->exec($stmt);
        $success++;
    } catch (PDOException $e) {
        // Log but continue — some errors are expected (e.g., duplicate keys)
        $preview = substr($stmt, 0, 80);
        echo "[importer] WARN: " . $e->getMessage() . " — stmt: $preview\n";
        $errors++;
    }
}

echo "[importer] Done: $success statements executed, $errors warnings\n";
exit(0);
