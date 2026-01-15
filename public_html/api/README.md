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
### For Local Development (Direct)
If you are running the project directly from your `D:` drive (XAMPP DocumentRoot pointing to project), you don't need to copy files. The API is available at `http://localhost/public_html/api`.

### For cPanel / Standard Production
1. Upload the **contents** of your local `public_html` folder to the `public_html` folder on your web server.
2. Ensure your database is imported via phpMyAdmin on the server.
3. Update `config.php` with your production database credentials.

## Step 4: Verify Connection
1. Ensure your Frontend `api.ts` is pointing to the correct URL (e.g., `http://your-domain.com/api` or `http://localhost/public_html/api`).
2. Go to your Frontend Application (running via `npm run dev`).
3. Try to **Login** with the default admin credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

## Troubleshooting
- **CORS Errors**: Ensure `config.php` in `htdocs` has the updated headers (I have already updated the source file, just make sure you copy it).
- **Database Connection Error**: Open `config.php` and check the `DB_USER` and `DB_PASS`. Default XAMPP uses `root` and empty password `''`, which is what `config.php` is set to.
