-- ============================================================================
--  Belang Rail PIS  ::  database schema
--  MySQL 5.7+ / MariaDB 10.4+
--
--  Fresh installation only, through scripts/install.php or manually:
--      mysql -u root -p < sql/schema.sql
-- ============================================================================

SET NAMES utf8mb4;




-- ----------------------------------------------------------------------------
-- users  ::  staff accounts for the operations centre
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
  `user_id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(100) NOT NULL,
  `email`           VARCHAR(150) NOT NULL,
  `password_hash`   VARCHAR(255) NOT NULL,
  `role`            ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  `is_active`       TINYINT(1) NOT NULL DEFAULT 1,
  `failed_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until`    DATETIME NULL DEFAULT NULL,
  `last_login`      DATETIME NULL DEFAULT NULL,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- rail_lines  ::  service lines published on the website
-- ----------------------------------------------------------------------------
CREATE TABLE `rail_lines` (
  `line_id`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(10) NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `operator`    VARCHAR(100) NOT NULL DEFAULT 'KTMB',
  `description` VARCHAR(500) NULL DEFAULT NULL,
  `colour_hex`  CHAR(7) NOT NULL DEFAULT '#005bbb',
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`line_id`),
  UNIQUE KEY `uq_lines_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- stations  ::  physical stations (interchanges appear once)
-- ----------------------------------------------------------------------------
CREATE TABLE `stations` (
  `station_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`       VARCHAR(10) NOT NULL,
  `name`       VARCHAR(120) NOT NULL,
  `zone`       VARCHAR(3) NULL DEFAULT NULL,
  `line_id`    INT UNSIGNED NULL DEFAULT NULL,
  `latitude`   DECIMAL(9,6) NULL DEFAULT NULL,
  `longitude`  DECIMAL(9,6) NULL DEFAULT NULL,
  `facilities` VARCHAR(255) NULL DEFAULT NULL,
  `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`station_id`),
  UNIQUE KEY `uq_stations_code` (`code`),
  KEY `idx_stations_line` (`line_id`),
  CONSTRAINT `fk_stations_line` FOREIGN KEY (`line_id`) REFERENCES `rail_lines` (`line_id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- trains  ::  rolling stock assigned to a line
-- ----------------------------------------------------------------------------
CREATE TABLE `trains` (
  `train_id`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `train_number` VARCHAR(20) NOT NULL,
  `train_type`   ENUM('Komuter','ETS','Intercity','Shuttle') NOT NULL DEFAULT 'Komuter',
  `direction`    ENUM('northbound','southbound') NOT NULL DEFAULT 'northbound',
  `capacity`     SMALLINT UNSIGNED NOT NULL DEFAULT 300,
  `line_id`      INT UNSIGNED NOT NULL,
  `status`       ENUM('active','maintenance','retired') NOT NULL DEFAULT 'active',
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`train_id`),
  UNIQUE KEY `uq_trains_number` (`train_number`),
  KEY `idx_trains_line` (`line_id`),
  CONSTRAINT `fk_trains_line` FOREIGN KEY (`line_id`) REFERENCES `rail_lines` (`line_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- timetable  ::  one scheduled trip per train
-- ----------------------------------------------------------------------------
CREATE TABLE `timetable` (
  `timetable_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `train_id`     INT UNSIGNED NOT NULL,
  `station_id`   INT UNSIGNED NOT NULL,
  `stop_seq`     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `arrival`      TIME NULL DEFAULT NULL,
  `departure`    TIME NULL DEFAULT NULL,
  PRIMARY KEY (`timetable_id`),
  UNIQUE KEY `uq_timetable_stop` (`train_id`, `station_id`),
  KEY `idx_timetable_station` (`station_id`),
  CONSTRAINT `fk_timetable_train` FOREIGN KEY (`train_id`) REFERENCES `trains` (`train_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_timetable_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- live_updates  ::  latest reported status per train (one row per train)
-- ----------------------------------------------------------------------------
CREATE TABLE `live_updates` (
  `update_id`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `train_id`     INT UNSIGNED NOT NULL,
  `station_id`   INT UNSIGNED NULL DEFAULT NULL,
  `status`       ENUM('on_time','delayed','cancelled','arriving') NOT NULL DEFAULT 'on_time',
  `delay_min`    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `eta`          DATETIME NULL DEFAULT NULL,
  `source_api`   VARCHAR(60) NOT NULL DEFAULT 'simulation',
  `is_simulated` TINYINT(1) NOT NULL DEFAULT 0,
  `fetched_at`   DATETIME NOT NULL,
  PRIMARY KEY (`update_id`),
  UNIQUE KEY `uq_live_train` (`train_id`),
  KEY `idx_live_eta` (`eta`),
  CONSTRAINT `fk_live_train` FOREIGN KEY (`train_id`) REFERENCES `trains` (`train_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_live_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- announcements  ::  service alerts published by operations
-- ----------------------------------------------------------------------------
CREATE TABLE `announcements` (
  `ann_id`       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`        VARCHAR(150) NOT NULL,
  `body`         TEXT NOT NULL,
  `type`         ENUM('info','delay','alert') NOT NULL DEFAULT 'info',
  `station_id`   INT UNSIGNED NULL DEFAULT NULL,
  `published_by` INT UNSIGNED NULL DEFAULT NULL,
  `expires_at`   DATETIME NULL DEFAULT NULL,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ann_id`),
  KEY `idx_ann_created` (`created_at`),
  KEY `idx_ann_type` (`type`),
  CONSTRAINT `fk_ann_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ann_user` FOREIGN KEY (`published_by`) REFERENCES `users` (`user_id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- messages  ::  contact form submissions
-- ----------------------------------------------------------------------------
CREATE TABLE `messages` (
  `message_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `email`      VARCHAR(150) NOT NULL,
  `subject`    VARCHAR(150) NOT NULL,
  `body`       TEXT NOT NULL,
  `ip`         VARCHAR(45) NULL DEFAULT NULL,
  `is_read`    TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `idx_messages_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- audit_log  ::  every write performed in the operations centre
-- ----------------------------------------------------------------------------
CREATE TABLE `audit_log` (
  `log_id`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NULL DEFAULT NULL,
  `action`     VARCHAR(50) NOT NULL,
  `entity`     VARCHAR(50) NULL DEFAULT NULL,
  `details`    VARCHAR(255) NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- settings  ::  key/value store (feed mode, last ingest, ...)
-- ----------------------------------------------------------------------------
CREATE TABLE `settings` (
  `setting_key`   VARCHAR(50) NOT NULL,
  `setting_value` VARCHAR(255) NOT NULL DEFAULT '',
  `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
