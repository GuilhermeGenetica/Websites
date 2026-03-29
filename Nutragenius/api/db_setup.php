<?php
// =================================================================
//  NutraGenius - Database Initializer
// =================================================================
//  WARNING: THIS SCRIPT WILL DELETE ALL EXISTING TABLES AND
//  RECREATE THE DATABASE SCHEMA FROM SCRATCH.
//  RUN THIS SCRIPT ONLY ONCE DURING INITIAL SETUP.
// =================================================================

require_once 'config.php';

try {
    // Connect to the database
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    echo "✅ Successfully connected to database: " . DB_NAME . "<br>";

    // Drop existing tables
    $dropTablesSQL = "
        SET FOREIGN_KEY_CHECKS = 0;
        DROP TABLE IF EXISTS
            `error_logs`,
            `password_resets`,
            `payments`,
            `questionnaires`,
            `rules`,
            `shared_reports`,
            `users`;
        SET FOREIGN_KEY_CHECKS = 1;
    ";
    $pdo->exec($dropTablesSQL);
    echo "🗑️ All existing tables dropped successfully.<br>";

    // Recreate tables
    $createTablesSQL = "

    CREATE TABLE `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `google_id` VARCHAR(255) UNIQUE,
        `full_name` VARCHAR(255) NOT NULL,
        `email` VARCHAR(255) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255),
        `avatar_url` VARCHAR(255),
        `dob` DATE NULL,
        `location` VARCHAR(255) NULL,
        `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
        `has_paid` TINYINT(1) NOT NULL DEFAULT 0,
        `is_active` TINYINT(1) NOT NULL DEFAULT 1,
        `stripe_customer_id` VARCHAR(255) UNIQUE,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE `password_resets` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `email` VARCHAR(255) NOT NULL,
        `token` VARCHAR(255) NOT NULL UNIQUE,
        `expires_at` DATETIME NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE `payments` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `stripe_payment_intent_id` VARCHAR(255) NOT NULL UNIQUE,
        `amount` INT NOT NULL,
        `currency` VARCHAR(10) NOT NULL,
        `status` VARCHAR(50) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE `questionnaires` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `fullName` VARCHAR(255),
        `age` INT,
        `gender` VARCHAR(50),
        `genderOther` VARCHAR(255),
        `height` DECIMAL(5,1),
        `weight` DECIMAL(5,1),
        `ethnicity` VARCHAR(100),
        `ethnicityOther` VARCHAR(255),
        `activityLevel` VARCHAR(100),
        `sleepHours` DECIMAL(4,1),
        `stressLevel` INT,
        `diet` VARCHAR(100),
        `dietOther` VARCHAR(255),
        `smokingStatus` VARCHAR(100),
        `alcoholConsumption` VARCHAR(100),
        `healthGoals` TEXT,
        `healthConcerns` TEXT,
        `medicalConditions` TEXT,
        `currentMedications` TEXT,
        `currentSupplements` TEXT,
        `allergies` TEXT,
        `hemoglobin` DECIMAL(5,2),
        `hematocrit` DECIMAL(5,2),
        `rbc` DECIMAL(5,2),
        `mcv` DECIMAL(5,2),
        `mch` DECIMAL(5,2),
        `mchc` DECIMAL(5,2),
        `rdw` DECIMAL(5,2),
        `wbc` DECIMAL(5,2),
        `neutrophils` DECIMAL(5,2),
        `lymphocytes` DECIMAL(5,2),
        `monocytes` DECIMAL(5,2),
        `eosinophils` DECIMAL(5,2),
        `basophils` DECIMAL(5,2),
        `platelets` DECIMAL(5,2),
        `vitaminD` DECIMAL(5,2),
        `vitaminB12` DECIMAL(5,2),
        `folate` DECIMAL(5,2),
        `vitaminB6` DECIMAL(5,2),
        `ferritin` DECIMAL(5,2),
        `serumIron` DECIMAL(5,2),
        `tibc` DECIMAL(5,2),
        `transferrinSat` DECIMAL(5,2),
        `serumMagnesium` DECIMAL(5,2),
        `rBCMagnesium` DECIMAL(5,2),
        `serumZinc` DECIMAL(5,2),
        `copper` DECIMAL(5,2),
        `selenium` DECIMAL(5,2),
        `totalCalcium` DECIMAL(5,2),
        `totalProtein` DECIMAL(5,2),
        `albumin` DECIMAL(5,2),
        `homocysteine` DECIMAL(5,2),
        `hsCRP` DECIMAL(5,2),
        `fibrinogen` DECIMAL(5,2),
        `totalCholesterol` DECIMAL(5,2),
        `ldl` DECIMAL(5,2),
        `hdl` DECIMAL(5,2),
        `triglycerides` DECIMAL(5,2),
        `apoB` DECIMAL(5,2),
        `lipoproteinA` DECIMAL(5,2),
        `fastingGlucose` DECIMAL(5,2),
        `hba1c` DECIMAL(5,2),
        `fastingInsulin` DECIMAL(5,2),
        `homaIR` DECIMAL(5,2),
        `uricAcid` DECIMAL(5,2),
        `alt` DECIMAL(5,2),
        `ast` DECIMAL(5,2),
        `ggt` DECIMAL(5,2),
        `alkalinePhosphatase` DECIMAL(5,2),
        `creatinine` DECIMAL(5,2),
        `eGFR` DECIMAL(5,2),
        `bun` DECIMAL(5,2),
        `sodium` DECIMAL(5,2),
        `potassium` DECIMAL(5,2),
        `tsh` DECIMAL(5,2),
        `freeT4` DECIMAL(5,2),
        `freeT3` DECIMAL(5,2),
        `tpoAb` DECIMAL(5,2),
        `thyroglobulinAb` DECIMAL(5,2),
        `cortisolAM` DECIMAL(5,2),
        `dheas` DECIMAL(5,2),
        `totalTestosterone` DECIMAL(5,2),
        `shbg` DECIMAL(5,2),
        `estradiol` DECIMAL(5,2),
        `progesterone` DECIMAL(5,2),
        `geneticVariants` TEXT,
        `geneticReport` LONGTEXT,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE `shared_reports` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `token` VARCHAR(255) NOT NULL UNIQUE,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `expires_at` DATETIME NOT NULL,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE `rules` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `category` VARCHAR(255) NOT NULL,
        `conditions_json` LONGTEXT NOT NULL,
        `logic` VARCHAR(10) NOT NULL DEFAULT 'AND',
        `response` TEXT NOT NULL,
        `key_nutrient_json` TEXT NULL,
        `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (`category`),
        INDEX (`is_active`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE `error_logs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `error_message` TEXT NOT NULL,
        `file_name` VARCHAR(255) NOT NULL,
        `line_number` INT NOT NULL,
        `context` TEXT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $pdo->exec($createTablesSQL);
    echo "✅ All tables created successfully.<br>";

    // Seed admin user
    $adminEmail = 'admin@nutragenius.com';
    $adminPassword = 'adminpass';
    $hashedPassword = password_hash($adminPassword, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)");
    $stmt->execute(['Admin User', $adminEmail, $hashedPassword, 1]);

    echo "👤 Default admin user created successfully.<br>";
    echo "<strong>🎉 DATABASE SETUP COMPLETE. PLEASE DELETE THIS FILE.</strong>";

} catch (PDOException $e) {
    // Log the error (requires log_error function from config.php)
    if (function_exists('log_error')) {
        log_error('Database setup failed: ' . $e->getMessage(), 'init_db.php', $e->getLine());
    }
    echo '❌ Error during database setup: ' . htmlspecialchars($e->getMessage());
    http_response_code(500);
    exit();
}
?>
