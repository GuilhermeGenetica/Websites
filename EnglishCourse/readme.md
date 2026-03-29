Perfect English - Deployment Guide for Hostinger
This guide provides step-by-step instructions to deploy the Perfect English application (React frontend and PHP backend) to a Hostinger shared hosting environment using SSH.

1. Prerequisites
Hostinger Account: A hosting plan that includes SSH access.

SSH Client: Terminal (macOS/Linux) or PuTTY/Windows Terminal (Windows).

Local Development Environment: Node.js, npm, and Composer installed on your local machine.

Project Files: The complete source code of your application ready on your local machine.

2. Local Preparation
Before uploading, you need to prepare your project.

Step 2.1: Install Dependencies
On your local machine, navigate to your project root and install all PHP and Node.js dependencies.

# Install PHP dependencies (like Dotenv, Ramsey/Uuid, etc.)
composer install --no-dev --optimize-autoloader

# Install Node.js dependencies for the React app
npm install
npm install @radix-ui/react-accordion lucide-react --legacy-peer-deps
npm install @radix-ui/react-avatar --legacy-peer-deps
npm install @radix-ui/react-switch --legacy-peer-deps
npm install clsx tailwind-merge --legacy-peer-deps
npm install  @radix-ui/react-checkbox --legacy-peer-deps
npm install @radix-ui/react-tooltip --legacy-peer-deps

Step 2.2: Create the Production Build
Build the optimized, static version of your React application. This command will create a dist directory with all the necessary HTML, CSS, and JavaScript files.

npm run build

Step 2.3: Configure Environment Variables
Your project uses a .env file for sensitive data. This file should never be committed to version control.

Create a file named .env in the root of your project.

Copy the contents from your development .env file or the example below.

Crucially, update the database credentials (DB_NAME, DB_USER, DB_PASS) to match the database you will create on Hostinger in the next steps.

Example .env file:

# / .env

# --- DATABASE CONFIGURATION (UPDATE WITH HOSTINGER CREDENTIALS) ---
DB_HOST="localhost"
DB_NAME="your_database_name"
DB_USER="your_database_user"
DB_PASS="Your_Hostinger_Database_Password"

# --- JWT CONFIGURATION (Keep this secret) ---
JWT_SECRET="generate_a_new_strong_secret_key_here"

# --- APPLICATION CONFIGURATION ---
FRONTEND_BASE_URL="https://your_domain.com"

# --- STRIPE, EMAIL, etc. can be configured here too ---

3. Hostinger Server Setup
Step 3.1: Connect via SSH
Log in to your Hostinger hPanel, find your plan, and go to Advanced -> SSH Access to find your connection details.

Connect using your terminal:

ssh username@your_domain.com -p 65002

Enter your SSH password when prompted.

Step 3.2: Create the Database
In hPanel, go to Databases -> MySQL Databases.

Create a new database. Note down the database name, user, and password. You will need these for your .env file.

Click Enter phpMyAdmin for the newly created database.

Step 3.3: Import the Database Schema
In phpMyAdmin, select your database from the left-hand menu.

Click on the Import tab.

Click Choose File and select the schema.sql file from your local project.

Scroll down and click Go. This will create the users and password_resets tables.

Important: The updated schema.sql now correctly defines the password_resets table. If you have an old version of this table, you should drop (delete) it before importing the new schema.

4. Upload Project Files
Navigate to the root directory for your website on Hostinger, which is typically public_html.

# After connecting via SSH
cd public_html

You can upload your files using an FTP client, the Hostinger File Manager, or more efficiently with rsync or scp from your local machine.

Example using rsync (recommended):
This command syncs your local project folder with the public_html directory on the server. It's fast and only transfers changed files.

# Run this from your LOCAL terminal in the project's root directory
rsync -avz -e "ssh -p 65002" --exclude 'node_modules' --exclude '.git' ./ username@your_domain.com:~/public_html/

5. Final Server Configuration
Step 5.1: Verify .htaccess
Ensure the .htaccess file is in your public_html directory with the correct content to handle SPA routing and security.

Step 5.2: Set File Permissions
Incorrect file permissions are a common cause of issues. The storage and vendor directories (if you have them) need to be writable by the server. Standard permissions are 755 for directories and 644 for files.

# Run this in your server's SSH terminal inside public_html
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

6. Troubleshooting
If you still encounter a 500 error after deployment:

Check the API Log: The new robust logging system creates a file at /tmp/perfect_english_api.log on your Hostinger server. Check this file for detailed error messages.

# In your SSH session
tail -f /tmp/perfect_english_api.log

Check PHP Version: In hPanel, go to Advanced -> PHP Configuration and ensure you are using PHP 8.1 or higher.

Environment Variables: Double-check that your .env file is in the root (public_html), is named correctly, and contains the correct database credentials.

Your application should now be fully functional.