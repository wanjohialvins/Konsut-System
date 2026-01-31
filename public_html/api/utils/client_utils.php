<?php
/**
 * Shared Client Utilities
 */

function ensureClientExists($pdo, $customer)
{
    if (empty($customer['id']) || empty($customer['name']))
        return ['id' => null, 'updated' => false];

    // Check if exists
    $stmt = $pdo->prepare("SELECT id FROM clients WHERE id = ?");
    $stmt->execute([$customer['id']]);
    if ($stmt->fetch()) {
        // Update existing client info
        $update = $pdo->prepare("UPDATE clients SET name=?, email=?, phone=?, address=?, kraPin=? WHERE id=?");
        $update->execute([
            $customer['name'],
            $customer['email'] ?? '',
            $customer['phone'] ?? '',
            $customer['address'] ?? '',
            $customer['kraPin'] ?? '',
            $customer['id']
        ]);
        return ['id' => $customer['id'], 'updated' => $update->rowCount() > 0];
    }

    // Create new
    $stmt = $pdo->prepare("INSERT INTO clients (id, name, email, phone, address, kraPin) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $customer['id'],
        $customer['name'],
        $customer['email'] ?? '',
        $customer['phone'] ?? '',
        $customer['address'] ?? '',
        $customer['kraPin'] ?? ''
    ]);
    return ['id' => $customer['id'], 'updated' => false];
}
