<?php
// backend/setup.php - Standalone version
$host = 'localhost';
$db = 'invoice_system';
$user = 'root';
$pass = ''; // Default XAMPP password is empty
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = "Username and password are required.";
    } else {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $role = 'admin';
        // Full permissions list
        $permissions = json_encode([
            "view_dashboard",
            "manage_users",
            "view_users",
            "manage_clients",
            "view_clients",
            "manage_invoices",
            "view_invoices",
            "manage_stock",
            "view_stock",
            "manage_settings",
            "view_settings",
            "system_control",
            "view_audit_logs",
            "view_security_logs",
            "manage_suppliers",
            "view_suppliers",
            "manage_documents",
            "view_documents",
            "manage_tasks",
            "view_tasks",
            "manage_memos",
            "view_memos",
            "view_reports"
        ]);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (username, password, email, role, permissions) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password = ?, role = ?, permissions = ?");
            $email = $username . '@example.com'; // Dummy email
            $stmt->execute([$username, $hashed_password, $email, $role, $permissions, $hashed_password, $role, $permissions]);
            $message = "Superuser '<strong>" . htmlspecialchars($username) . "</strong>' created/updated successfully! <br><br> <span style='color:red; font-weight:bold;'>IMPORTANT: Please delete this file (setup.php) from your server now.</span>";
        } catch (PDOException $e) {
            $error = "Database Error: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Super Admin</title>
    <style>
        body {
            font-family: sans-serif;
            background: #f4f4f9;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        }

        h1 {
            margin-top: 0;
            color: #333;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #666;
        }

        input {
            width: 100%;
            padding: 0.5rem;
            margin-bottom: 1rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }

        button {
            width: 100%;
            padding: 0.75rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
        }

        button:hover {
            background: #1d4ed8;
        }

        .alert {
            padding: 0.75rem;
            border-radius: 4px;
            margin-bottom: 1rem;
        }

        .alert-success {
            background: #d1fae5;
            color: #065f46;
        }

        .alert-error {
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>Create Super Admin</h1>
        <?php if ($message): ?>
            <div class="alert alert-success"><?php echo $message; ?></div>
        <?php endif; ?>
        <?php if ($error): ?>
            <div class="alert alert-error"><?php echo $error; ?></div>
        <?php endif; ?>

        <form method="POST">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" placeholder="e.g., superadmin" required>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter specific password" required>

            <button type="submit">Create Account</button>
        </form>
    </div>
</body>

</html>