use prmcf_db;

CREATE TABLE user_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(50) UNIQUE
);

INSERT INTO user_types (type_name) VALUES
('admin'),
('member'),
('committee'),
('president');

CREATE TABLE members (
 id INT AUTO_INCREMENT PRIMARY KEY,

  member_id VARCHAR(20) UNIQUE,

  user_type_id INT,

  gotra VARCHAR(100),
  family_name VARCHAR(100),
  name VARCHAR(100),
  father_name VARCHAR(100),

  phone VARCHAR(15),
  whatsapp VARCHAR(15),

  blood_group VARCHAR(5),
  dob DATE,
  occupation VARCHAR(100),

  out_of_rajapalayam BOOLEAN DEFAULT FALSE,

  address_id INT,
  outside_address_id INT,
  address_proof_id INT,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,

  member_id INT,

  type ENUM('local', 'outside'),

  door_no VARCHAR(50),
  area VARCHAR(100),
  city VARCHAR(100),
  pincode VARCHAR(10),
  state VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE address_proofs (
  id INT AUTO_INCREMENT PRIMARY KEY,

  member_id INT,

  file_url VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE members ADD COLUMN member_table_id TEXT NULL DEFAULT NULL AFTER member_id;

ALTER TABLE members ADD COLUMN qr_code VARCHAR(255) NULL AFTER member_table_id;

-- ============================================================
-- PAYMENT FEATURE
-- ============================================================

CREATE TABLE payment_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  default_amount DECIMAL(10, 2) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payment_categories (name, description, default_amount) VALUES
('Annual Membership Fee', 'Yearly membership fee for all members', 500.00),
('Event Fee', 'Fee collected for specific events', NULL),
('Donation', 'Voluntary donation by member', NULL),
('Other', 'Other miscellaneous payments', NULL);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_ref VARCHAR(30) UNIQUE NOT NULL,
  member_id INT NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  collected_by INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE `members` ADD `photo` TEXT NULL AFTER `qr_code`;


CREATE TABLE events (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      title            VARCHAR(500)  NOT NULL,
      status           ENUM('upcoming','ongoing','completed') NOT NULL DEFAULT 'upcoming',
      date             DATE          NOT NULL,
      start_time       VARCHAR(20)   NULL,
      end_time         VARCHAR(20)   NULL,
      location         VARCHAR(500)  NULL,
      attendees        VARCHAR(50)   NULL,
      short_description TEXT         NULL,
      full_description  TEXT         NULL,
      highlights       JSON          NULL,
      organizer        VARCHAR(300)  NULL,
      contact_person   VARCHAR(300)  NULL,
      phone            VARCHAR(30)   NULL,
      is_live          TINYINT(1)    NOT NULL DEFAULT 0,
      video_link       VARCHAR(1000) NULL,
      image            VARCHAR(500)  NULL,
      is_active        TINYINT(1)    NOT NULL DEFAULT 1,
      created_at       DATETIME      NOT NULL
    );

ALTER TABLE members ADD COLUMN email VARCHAR(150) NULL;
ALTER TABLE members ADD COLUMN aadhar_number VARCHAR(12) NULL;
ALTER TABLE members ADD COLUMN engagement_date DATE NULL;
ALTER TABLE members ADD COLUMN marriage_date DATE NULL;

ALTER TABLE payments ADD COLUMN payment_type ENUM('cash', 'qr') NOT NULL DEFAULT 'cash';

-- ============================================================
-- AUTH FEATURE
-- ============================================================

CREATE TABLE otp_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE route_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_key VARCHAR(100) NOT NULL UNIQUE,
  route_label VARCHAR(200) NOT NULL,
  description VARCHAR(300),
  require_login TINYINT(1) DEFAULT 0,
  allowed_type_ids JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO route_permissions (route_key, route_label, description, require_login, allowed_type_ids) VALUES
('admin', 'Admin Panel', 'Full admin panel access — requires admin user type', 1, '[1]'),
('donate', 'Donate Page', 'Donation page — any logged-in member can access', 1, '[]'),
('dashboard', 'Member Dashboard', 'Member dashboard — any logged-in user', 1, '[]');

-- ============================================================
-- OFFLINE FORM WORKFLOW FEATURE
-- ============================================================
-- Adapted from docs/PRMCF_Offline_Workflow_Design.md to this project's
-- conventions:
--   * INT AUTO_INCREMENT (not BIGINT) to match the rest of the schema.
--   * No FOREIGN KEY constraints, matching every other table in this
--     schema (members, payments, events, etc. all reference each other
--     via plain INT columns with no FK enforcement) — only PRIMARY KEY
--     and UNIQUE are used.
--   * services has BOTH is_active (soft delete) and is_published
--     (member-facing visibility toggle) instead of a single flag, so
--     "Delete Service" and "Publish/Unpublish Service" stay independent.
--   * workflow_steps.user_type_id is a plain INT referencing
--     user_types.id instead of a free-text role column, reusing the
--     existing RBAC (admin/member/committee/president) instead of
--     hardcoding role names.
--   * request_workflow_history has no role column — it's derived via
--     workflow_step_id -> user_type_id when needed.
--   * The filled offline form itself is stored as a request_documents
--     row with service_document_id = NULL and document_type =
--     'OFFLINE_FORM', so no separate column/table is needed for it.

CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  offline_form_path VARCHAR(500),
  offline_form_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE service_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  document_name VARCHAR(200) NOT NULL,
  mandatory BOOLEAN DEFAULT TRUE,
  allowed_extensions VARCHAR(100) DEFAULT 'pdf,jpg,jpeg,png',
  max_file_size_mb INT DEFAULT 5,
  display_order INT DEFAULT 1
);

CREATE TABLE workflow_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  step_no INT NOT NULL,
  user_type_id INT NOT NULL,
  step_label VARCHAR(100),
  can_reject BOOLEAN DEFAULT TRUE,
  is_final BOOLEAN DEFAULT FALSE,
  UNIQUE KEY uniq_service_step (service_id, step_no)
);

CREATE TABLE service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_no VARCHAR(30) UNIQUE,
  service_id INT NOT NULL,
  member_id INT NOT NULL,
  status ENUM('SUBMITTED','IN_PROGRESS','APPROVED','REJECTED','COMPLETED') DEFAULT 'SUBMITTED',
  current_step INT DEFAULT 1,
  remarks TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);

CREATE TABLE request_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  service_document_id INT NULL,
  document_type VARCHAR(200),
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE request_workflow_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  workflow_step_id INT NOT NULL,
  action_by INT,
  status VARCHAR(50),
  remarks TEXT,
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO route_permissions (route_key, route_label, description, require_login, allowed_type_ids) VALUES
('services', 'Offline Services', 'Browse services, submit requests, track status and approvals', 1, '[]');

-- ============================================================
-- PAYMENT ⇄ DUE SYNC ENHANCEMENT
-- ============================================================
-- No FOREIGN KEY / PRIMARY KEY constraints added, matching this table's
-- own existing convention (payments/pending_payments columns like
-- member_id, category_id, collected_by are plain INTs with app-level
-- existence checks only, not DB-enforced FKs).

-- Every due now belongs to a payment category (so due-creation UI reuses
-- the same category list + default_amount as Record Payment). Backfill
-- existing rows to "Other" (id 4 in the seed data) before tightening to
-- NOT NULL.
ALTER TABLE pending_payments ADD COLUMN category_id INT NULL AFTER member_id;
UPDATE pending_payments SET category_id = 4 WHERE category_id IS NULL;
ALTER TABLE pending_payments MODIFY COLUMN category_id INT NOT NULL;

-- Links a payment back to the due it cleared. NULL = a standalone/ad-hoc
-- payment not tied to any due (e.g. "collect new money").
ALTER TABLE payments ADD COLUMN pending_payment_id INT NULL AFTER member_id;

-- ============================================================
-- ATTENDANCE FEATURE
-- ============================================================
-- Standard id AUTO_INCREMENT PRIMARY KEY (same as every other table —
-- required for insertId). No FOREIGN KEY constraints, matching this
-- schema's existing convention. Multiple rows per member per day are
-- expected (one row per check-in/check-out session).

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_time DATETIME NOT NULL,
  check_out_time DATETIME NULL,
  marked_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- MEMBER STATUS FEATURE
-- ============================================================
-- Same shape/convention as user_types (id + unique name, admin-managed via
-- Settings). No FOREIGN KEY on members.status_id, matching this schema's
-- existing convention.

CREATE TABLE member_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO member_status (status_name) VALUES
('Active'),
('Inactive'),
('Deceased');

ALTER TABLE members ADD COLUMN status_id INT NULL AFTER is_active;

-- Backfill existing members from their current is_active flag.
UPDATE members m
JOIN member_status s ON s.status_name = 'Active'
SET m.status_id = s.id
WHERE m.is_active = 1;

UPDATE members m
JOIN member_status s ON s.status_name = 'Inactive'
SET m.status_id = s.id
WHERE m.is_active = 0;

-- ============================================================
-- PASSWORD-BASED LOGIN (replaces OTP)
-- ============================================================
-- Hashing can't be done in raw SQL — after running this ALTER (or after any
-- data migration that drops passwords), backfill existing members by
-- running once from backend/:
--   node scripts/backfillMemberPasswords.js
-- (defaults every member without a password to their member_id, zero-padded
-- to 6 digits, hashed — e.g. member_id 88 -> 000088). New members get the
-- same default automatically going forward (see memberModel.createMember).

ALTER TABLE members ADD COLUMN password VARCHAR(255) NULL AFTER phone;

-- ============================================================
-- EXPENSE BOOK FEATURE
-- ============================================================
-- Mirrors payment_categories/payments: no FOREIGN KEY constraints;
-- category_id and created_by are plain INT columns with app-level
-- existence checks only, matching this schema's existing convention.
-- created_by/created_at are captured server-side from the authenticated
-- admin's session (not client-supplied), so there is no separate
-- "recorded by" input on the form — created_at doubles as both the
-- entry timestamp and the expense date.

CREATE TABLE expense_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO expense_categories (name, description) VALUES
('Stationery', 'Office and printing supplies'),
('Maintenance', 'Building and equipment upkeep'),
('Event Expense', 'Costs incurred for organizing events'),
('Utilities', 'Electricity, water, and other utility bills'),
('Other', 'Other miscellaneous expenses');

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);