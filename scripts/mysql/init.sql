-- ============================================
-- BSM Platform - MySQL Database Initialization
-- ============================================
-- This script is automatically executed when MySQL container starts
-- Place this file in docker-compose volume mount:
--   - ./scripts/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
-- ============================================

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================
-- Create BSM Database (if not exists)
-- ============================================
CREATE DATABASE IF NOT EXISTS bsm_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE bsm_db;

-- ============================================
-- Create Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  role ENUM('admin', 'user', 'viewer') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Create Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT UNSIGNED,
  data JSON,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Create Agents Table
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSON,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Create Agent Executions Table
-- ============================================
CREATE TABLE IF NOT EXISTS agent_executions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id VARCHAR(100) NOT NULL,
  user_id INT UNSIGNED,
  input TEXT,
  output TEXT,
  status ENUM('pending', 'running', 'success', 'error') DEFAULT 'pending',
  error_message TEXT,
  duration_ms INT UNSIGNED,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_agent_id (agent_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Create Audit Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  user_id INT UNSIGNED,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  correlation_id VARCHAR(100),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type),
  INDEX idx_action (action),
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_correlation_id (correlation_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Create Knowledge Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT,
  category VARCHAR(100),
  tags JSON,
  metadata JSON,
  version INT UNSIGNED DEFAULT 1,
  created_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_created_at (created_at),
  FULLTEXT idx_title_content (title, content),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Sample Data (Development Only)
-- ============================================

-- Sample admin user
INSERT INTO users (username, email, role) 
VALUES 
  ('admin', 'admin@lexdo.uk', 'admin'),
  ('demo_user', 'demo@lexdo.uk', 'user')
ON DUPLICATE KEY UPDATE username=username;

-- Sample agents (matching data/agents configurations)
INSERT INTO agents (id, name, description, enabled) 
VALUES
  ('legal-advisor', 'Legal Advisor', 'AI-powered legal consultation and advice', TRUE),
  ('document-analyzer', 'Document Analyzer', 'Analyze and extract insights from legal documents', TRUE),
  ('contract-reviewer', 'Contract Reviewer', 'Review contracts for risks and compliance', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- Create Views
-- ============================================

-- Active agents view
CREATE OR REPLACE VIEW active_agents AS
SELECT 
  id,
  name,
  description,
  created_at,
  updated_at
FROM agents
WHERE enabled = TRUE;

-- Recent executions view
CREATE OR REPLACE VIEW recent_executions AS
SELECT 
  e.id,
  e.agent_id,
  a.name AS agent_name,
  e.user_id,
  u.username,
  e.status,
  e.duration_ms,
  e.started_at,
  e.completed_at
FROM agent_executions e
LEFT JOIN agents a ON e.agent_id = a.id
LEFT JOIN users u ON e.user_id = u.id
ORDER BY e.started_at DESC
LIMIT 100;

-- ============================================
-- Create Stored Procedures
-- ============================================

DELIMITER //

-- Log agent execution
CREATE PROCEDURE IF NOT EXISTS log_agent_execution(
  IN p_agent_id VARCHAR(100),
  IN p_user_id INT UNSIGNED,
  IN p_input TEXT,
  OUT p_execution_id BIGINT UNSIGNED
)
BEGIN
  INSERT INTO agent_executions (agent_id, user_id, input, status)
  VALUES (p_agent_id, p_user_id, p_input, 'pending');
  
  SET p_execution_id = LAST_INSERT_ID();
END //

-- Complete agent execution
CREATE PROCEDURE IF NOT EXISTS complete_agent_execution(
  IN p_execution_id BIGINT UNSIGNED,
  IN p_output TEXT,
  IN p_status VARCHAR(20),
  IN p_error_message TEXT,
  IN p_duration_ms INT UNSIGNED
)
BEGIN
  UPDATE agent_executions
  SET 
    output = p_output,
    status = p_status,
    error_message = p_error_message,
    duration_ms = p_duration_ms,
    completed_at = CURRENT_TIMESTAMP
  WHERE id = p_execution_id;
END //

DELIMITER ;

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant permissions to bsm_user (created by docker-compose)
GRANT ALL PRIVILEGES ON bsm_db.* TO 'bsm_user'@'%';
FLUSH PRIVILEGES;

-- ============================================
-- Database Info
-- ============================================
SELECT 
  'BSM Database Initialized Successfully' AS status,
  VERSION() AS mysql_version,
  DATABASE() AS current_database,
  @@character_set_database AS charset,
  @@collation_database AS collation;

-- Show tables
SHOW TABLES;
