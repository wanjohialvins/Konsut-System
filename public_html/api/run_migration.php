<?php
require_once 'config.php';
$pdo = getDbConnection();

$sql = "
-- Add role-based assignment to tasks
ALTER TABLE tasks ADD COLUMN assignee_role VARCHAR(50) DEFAULT NULL;

-- Add targeting to notifications
ALTER TABLE notifications ADD COLUMN assignee_id INT DEFAULT NULL;
ALTER TABLE notifications ADD COLUMN assignee_role VARCHAR(50) DEFAULT NULL;

-- Per-user notification tracking
CREATE TABLE IF NOT EXISTS notification_reads (
    user_id INT NOT NULL,
    notification_id VARCHAR(50) NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, notification_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

try {
    $pdo->exec($sql);
    echo "Migration successful!";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
}
?>