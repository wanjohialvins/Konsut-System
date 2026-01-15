<?php
// backend/debug_login.php - Standalone version
$host = 'localhost';
$db = 'invoice_system';
$user = 'root';
$pass = ''; // Default XAMPP password
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
$resultInfo = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user) {
        $resultInfo['username'] = $user['username'];
        $resultInfo['role'] = $user['role'];
        $resultInfo['stored_hash'] = $user['password'];
        $resultInfo['input_password'] = $password;

        $match = password_verify($password, $user['password']);
        $resultInfo['match'] = $match ? 'YES' : 'NO';

        if ($match) {
            $message = "<div style='color:green; font-weight:bold;'>SUCCESS: Password matches!</div>";
        } else {
            $message = "<div style='color:red; font-weight:bold;'>FAILURE: Password does NOT match stored hash.</div>";
            $message .= "<br>Generated hash of input: " . password_hash($password, PASSWORD_DEFAULT);
        }
    } else {
        $message = "<div style='color:red;'>User '$username' NOT FOUND in database.</div>";
    }
}

// Get all users
$users = $pdo->query("SELECT id, username, role, created_at FROM users")->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        th {
            background-color: #f2f2f2;
        }

        .box {
            border: 1px solid #ccc;
            padding: 20px;
            margin-bottom: 20px;
            background: #fafafa;
        }
    </style>
</head>

<body>
    <h1>Login Debugger</h1>

    <div class="box">
        <h2>Test Specific Login</h2>
        <?php echo $message; ?>
        <?php if (!empty($resultInfo)): ?>
            <pre><?php print_r($resultInfo); ?></pre>
        <?php endif; ?>

        <form method="POST">
            <input type="text" name="username" placeholder="Username" required>
            <input type="text" name="password" placeholder="Password" required>
            <button type="submit">Test Login</button>
        </form>
    </div>

    <h2>Existing Users in DB</h2>
    <table>
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Created At</th>
        </tr>
        <?php foreach ($users as $u): ?>
            <tr>
                <td><?php echo htmlspecialchars($u['id']); ?></td>
                <td><?php echo htmlspecialchars($u['username']); ?></td>
                <td><?php echo htmlspecialchars($u['role']); ?></td>
                <td><?php echo htmlspecialchars($u['created_at']); ?></td>
            </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>