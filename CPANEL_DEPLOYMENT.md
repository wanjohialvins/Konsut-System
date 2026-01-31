# cPanel Deployment Guide via GitHub Actions

This guide outlines a robust, automated workflow for deploying the **KONSUT System** to a cPanel environment using GitHub Actions.

## Prerequisites

1.  **cPanel Access**: credentials for valid FTP/FTPS or SSH access.
2.  **GitHub Repository**: Admin access to configure Secrets.
3.  **Database**: MySQL database created in cPanel.

## Workflow Overview

We will use the **SamKirkland/FTP-Deploy-Action** (standard industry choice) to sync the `dist/` (frontend) and `public_html/api/` (backend) folders to your server automatically upon push to `main`.

---

## Step 1: Prepare Repository for Deployment

Ensure your repository has a `.github/workflows/deploy.yml` file.

### Create `.github/workflows/deploy.yml`

```yaml
name: Deploy to cPanel

on:
  push:
    branches:
      - main

jobs:
  web-deploy:
    name: 🎉 Deploy
    runs-on: ubuntu-latest
    steps:
      - name: 🚚 Get latest code
        uses: actions/checkout@v4

      - name: 🔧 Build Frontend
        uses: actions/setup-node@v4
        with:
          node-version: '20'
        
      - run: npm ci
      - run: npm run build

      - name: 📂 Sync Files
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          protocol: ftps
          # Deploy compiled frontend
          local-dir: ./dist/ 
          # To public web root (adjust if in subfolder)
          server-dir: ./public_html/ 
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**
            **/src/**
            .env
            
      - name: 📂 Sync Backend API
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          protocol: ftps
          local-dir: ./public_html/api/
          server-dir: ./public_html/api/
```

## Step 2: Configure Secrets

1.  Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2.  Add the following secrets:
    *   `FTP_SERVER`: Your domain (e.g., `ftp.konsut.com` or IP).
    *   `FTP_USERNAME`: Your cPanel username.
    *   `FTP_PASSWORD`: Your cPanel password.

## Step 3: Database Setup

1.  Log in to **cPanel** -> **MySQL® Databases**.
2.  Create a new database (e.g., `konsut_db`).
3.  Import the schema from `public_html/utility/database.sql`.
4.  Update your `public_html/api/config.php` on the server (or separate production config) with the new credentials.

---

## Post-Deployment Checklist

*   [ ] Verify `https://yourdomain.com` loads the React app.
*   [ ] Verify `https://yourdomain.com/api/health.php` returns status OK.
*   [ ] Ensure `apache` or `.htaccess` redirects all non-API traffic to `index.html` (React Routing).
