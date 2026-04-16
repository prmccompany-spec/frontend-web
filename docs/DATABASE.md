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