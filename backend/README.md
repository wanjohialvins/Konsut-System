# KONSUT System - Backend Setup Guide

This guide will help you set up the PHP backend for the KONSUT System using XAMPP.

## Prerequisites
- **XAMPP** installed (Download from [apachefriends.org](https://www.apachefriends.org/index.html)).

## Step 1: Start XAMPP
1. Open **XAMPP Control Panel**.
2. Click **Start** next to **Apache** and **MySQL**.
3. Ensure both turn green.

## Step 2: Configure Database
1. Open your web browser and go to [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
2. Click **New** in the left sidebar.
3. Enter database name: `invoice_system`.
4. Select collation: `utf8mb4_general_ci`.
5. Click **Create**.
6. Click on the `invoice_system` database you just created.
7. Click the **Import** tab at the top.
8. Click **Choose File** and select the `database.sql` file located in your backend folder, or use this path:
   `d:\Personal Projects\invoice system database\backend\database.sql`
9. Click **Import** at the bottom of the page.
   - *Success Message*: "Import has been successfully finished."

## Step 3: Deploy Backend Files
1. Navigate to your XAMPP installation folder, usually `C:\xampp`.
2. Open the `htdocs` folder: `C:\xampp\htdocs`.
3. Create a new folder named `invoice-system-backend`.
4. Copy **ALL files** from your local backend folder:
   `d:\Personal Projects\invoice system database\backend`
   ...into the new `C:\xampp\htdocs\invoice-system-backend` folder.

Your structure should look like:
- `C:\xampp\htdocs\invoice-system-backend/config.php`
- `C:\xampp\htdocs\invoice-system-backend/auth.php`
- `C:\xampp\htdocs\invoice-system-backend/admin/...` etc.

## Step 4: Verify Connection
1. Ensure your Frontend `api.ts` is pointing to the correct URL (I have already verified it is set to `http://localhost/invoice-system-backend`).
2. Go to your Frontend Application (running via `npm run dev`).
3. Try to **Login** with the default admin credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

## Troubleshooting
- **CORS Errors**: Ensure `config.php` in `htdocs` has the updated headers (I have already updated the source file, just make sure you copy it).
- **Database Connection Error**: Open `config.php` and check the `DB_USER` and `DB_PASS`. Default XAMPP uses `root` and empty password `''`, which is what `config.php` is set to.
