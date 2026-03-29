-- ============================================================
--  SeqNode-OS — User Database Schema
--  Engine: MySQL 8.0+ / MariaDB 10.5+
--  Run via Hostinger phpMyAdmin
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                     INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    uuid                   CHAR(36)            NOT NULL,

    -- Authentication
    email                  VARCHAR(255)        NOT NULL,
    password_hash          VARCHAR(255)        NOT NULL,

    -- Basic profile
    full_name              VARCHAR(255)        NOT NULL,
    display_name           VARCHAR(100)        NULL,
    bio                    TEXT                NULL,
    avatar_url             VARCHAR(500)        NULL,

    -- User type & permissions
    role                   ENUM(
                               'researcher',
                               'physician',
                               'bioinformatician',
                               'student',
                               'university_staff',
                               'institution'
                           )                   NOT NULL DEFAULT 'researcher',
    is_admin               TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,

    -- Account status
    is_active              TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
    is_verified            TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
    email_verified_at      DATETIME            NULL,

    -- Professional information
    institution            VARCHAR(255)        NULL COMMENT 'University, hospital or company',
    department             VARCHAR(255)        NULL COMMENT 'Department or division',
    position               VARCHAR(255)        NULL COMMENT 'Job title or role',
    specialty              VARCHAR(255)        NULL COMMENT 'Medical specialty (physicians)',
    orcid                  VARCHAR(50)         NULL COMMENT 'ORCID ID (https://orcid.org/)',
    crm                    VARCHAR(50)         NULL COMMENT 'Brazilian medical license number',

    -- Contact & location
    phone                  VARCHAR(30)         NULL,
    country                VARCHAR(100)        NULL,
    city                   VARCHAR(100)        NULL,
    website                VARCHAR(500)        NULL,

    -- Subscription / Plan
    plan                   ENUM('free','basic','professional','institutional')
                                               NOT NULL DEFAULT 'free',
    plan_expires_at        DATETIME            NULL,
    stripe_customer_id     VARCHAR(100)        NULL COMMENT 'Stripe customer ID (future billing)',
    stripe_subscription_id VARCHAR(100)        NULL,

    -- Admin-only notes
    notes                  TEXT                NULL,

    -- Session metadata
    login_count            INT UNSIGNED        NOT NULL DEFAULT 0,
    last_login_at          DATETIME            NULL,
    last_login_ip          VARCHAR(45)         NULL,
    created_ip             VARCHAR(45)         NULL,

    -- Timestamps
    created_at             DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at             DATETIME            NULL COMMENT 'Soft delete',

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_uuid  (uuid),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role        (role),
    KEY idx_users_plan        (plan),
    KEY idx_users_is_active   (is_active),
    KEY idx_users_is_verified (is_verified),
    KEY idx_users_deleted_at  (deleted_at),
    KEY idx_users_created_at  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Refresh tokens (JWT rotation) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    token_hash CHAR(64)     NOT NULL COMMENT 'SHA-256 hash of the plain token',
    expires_at DATETIME     NOT NULL,
    revoked_at DATETIME     NULL,
    user_agent VARCHAR(500) NULL,
    ip_address VARCHAR(45)  NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_rt_token_hash (token_hash),
    KEY idx_rt_user_id          (user_id),
    KEY idx_rt_expires_at       (expires_at),
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Email verification ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verifications (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED NOT NULL,
    token       CHAR(64)     NOT NULL,
    expires_at  DATETIME     NOT NULL,
    verified_at DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_ev_token (token),
    KEY idx_ev_user_id     (user_id),
    CONSTRAINT fk_ev_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Password resets ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    token      CHAR(64)     NOT NULL,
    expires_at DATETIME     NOT NULL,
    used_at    DATETIME     NULL,
    ip_address VARCHAR(45)  NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_pr_token (token),
    KEY idx_pr_user_id     (user_id),
    CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Login attempts (rate limiting + audit log) ────────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email        VARCHAR(255) NULL,
    ip_address   VARCHAR(45)  NULL,
    success      TINYINT(1)   NOT NULL DEFAULT 0,
    attempted_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_la_ip        (ip_address),
    KEY idx_la_email     (email(50)),
    KEY idx_la_attempted (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Seed: initial administrator account ──────────────────────────────────────
-- Password: Admin@SeqNode2025  (bcrypt cost 12 — CHANGE IMMEDIATELY after first login)
INSERT IGNORE INTO users (
    uuid, email, password_hash, full_name, role, is_admin, is_active, is_verified, plan
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    'guilherme.genetica@gmail.com',
    '$2y$12$W248XGqTziv6ukbcgvPr.u3jZwlBS1S5UfXQsGSfpIEjlaik/XCGG',
    'SeqNode Administrator',
    'researcher',
    1,
    1,
    1,
    'institutional'
);

-- ── User preferences (UI settings, agent config — stored in Hostinger MySQL) ──
-- Independent of VPS. Persists even when the execution backend is offline.
CREATE TABLE IF NOT EXISTS user_preferences (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    section    VARCHAR(50)  NOT NULL COMMENT 'ui | agent | plugin_defaults',
    data       JSON         NOT NULL,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_up_user_section (user_id, section),
    KEY idx_up_user_id (user_id),
    CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Agent connection tokens ────────────────────────────────────────────────────
-- Each user can have one active agent token.
-- The plain token is stored (not hashed) so it can be shown in the Settings panel.
-- Treat it like an API key — never log it, transmit only over HTTPS.
CREATE TABLE IF NOT EXISTS agent_tokens (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    token      VARCHAR(80)  NOT NULL COMMENT 'Plain token shown in UI (HTTPS only)',
    label      VARCHAR(100) NULL      COMMENT 'e.g. "Home workstation"',
    last_seen  DATETIME     NULL,
    agent_url  VARCHAR(500) NULL      COMMENT 'Agent reported URL (filled by agent on connect)',
    agent_info JSON         NULL      COMMENT 'OS, hostname, CPU etc (filled by agent)',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_at_token   (token),
    UNIQUE KEY uq_at_user_id (user_id) COMMENT 'One active token per user',
    CONSTRAINT fk_at_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Optional: scheduled cleanup event (MySQL Event Scheduler) ─────────────────
-- CREATE EVENT IF NOT EXISTS cleanup_expired_tokens
-- ON SCHEDULE EVERY 1 DAY
-- DO BEGIN
--   DELETE FROM refresh_tokens   WHERE expires_at < NOW() - INTERVAL 7 DAY;
--   DELETE FROM login_attempts   WHERE attempted_at < NOW() - INTERVAL 30 DAY;
--   DELETE FROM password_resets  WHERE expires_at < NOW() - INTERVAL 7 DAY;
-- END;
