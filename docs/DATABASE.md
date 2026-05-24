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