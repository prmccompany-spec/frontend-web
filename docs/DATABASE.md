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