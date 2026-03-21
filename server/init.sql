-- =============================================
-- Weiyuan AI 初始化 SQL 脚本
-- 根据系统模型定义生成
-- 使用方法: mysql -u root -p < init.sql
-- =============================================

DROP DATABASE IF EXISTS weiyuan_ai;

CREATE DATABASE weiyuan_ai 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE weiyuan_ai;

-- =============================================
-- 用户表 (users)
-- =============================================
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),
  api_key VARCHAR(64) NOT NULL UNIQUE,
  password VARCHAR(255),
  balance INT DEFAULT 0,
  total_purchased INT DEFAULT 0,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_api_key (api_key),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Skills 表 (skills)
-- =============================================
CREATE TABLE skills (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(500),
  category VARCHAR(50),
  price_per_call INT DEFAULT 100,
  package_sizes JSON,
  file_url VARCHAR(500),
  package_url VARCHAR(500),
  version VARCHAR(20) DEFAULT '1.0.0',
  author VARCHAR(100),
  readme TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  download_count INT DEFAULT 0,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_is_active (is_active),
  INDEX idx_usage_count (usage_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 订单表 (orders)
-- =============================================
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  user_id VARCHAR(36) NOT NULL,
  skill_id VARCHAR(36),
  amount INT NOT NULL,
  package_size INT NOT NULL,
  payment_method ENUM('wechat', 'alipay') NOT NULL,
  transaction_id VARCHAR(128),
  status ENUM('pending', 'paid', 'refunded', 'cancelled') DEFAULT 'pending',
  paid_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 余额变动日志表 (balance_logs)
-- =============================================
CREATE TABLE balance_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  `change` INT NOT NULL,
  reason VARCHAR(100) NOT NULL,
  balance_after INT NOT NULL,
  related_id VARCHAR(36),
  type ENUM('purchase', 'consume', 'refund', 'adjustment') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Skill 调用记录表 (invocations)
-- =============================================
CREATE TABLE invocations (
  id VARCHAR(36) PRIMARY KEY,
  invocation_id VARCHAR(64) NOT NULL UNIQUE,
  user_id VARCHAR(36) NOT NULL,
  skill_id VARCHAR(36) NOT NULL,
  cost INT DEFAULT 1,
  balance_after INT NOT NULL,
  status ENUM('success', 'failed') DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_skill_id (skill_id),
  INDEX idx_invocation_id (invocation_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- API 端点表 (api_endpoints)
-- =============================================
CREATE TABLE api_endpoints (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  target_url VARCHAR(500) NOT NULL,
  method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') DEFAULT 'POST',
  path_prefix VARCHAR(100) NOT NULL,
  auth_type ENUM('none', 'api_key', 'bearer', 'basic') DEFAULT 'bearer',
  auth_value TEXT,
  headers_mapping JSON,
  request_example TEXT,
  response_example TEXT,
  price_per_call INT DEFAULT 100,
  rate_limit INT DEFAULT 60,
  timeout INT DEFAULT 30000,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  type ENUM('api', 'image', 'video') DEFAULT 'api',
  icon VARCHAR(100),
  default_params JSON,
  output_fields JSON,
  is_generate_tool BOOLEAN DEFAULT FALSE,
  show_in_generate BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_path_prefix (path_prefix),
  INDEX idx_is_active (is_active),
  INDEX idx_show_in_generate (show_in_generate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- API 调用记录表 (api_invocations)
-- =============================================
CREATE TABLE api_invocations (
  id VARCHAR(36) PRIMARY KEY,
  invocation_id VARCHAR(100) NOT NULL UNIQUE,
  endpoint_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  cost INT DEFAULT 0,
  status ENUM('success', 'failed', 'timeout') DEFAULT 'success',
  error_message TEXT,
  latency INT DEFAULT 0,
  ip_address VARCHAR(45),
  request_path VARCHAR(500),
  response_code INT,
  request_body TEXT,
  response_body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_endpoint_id (endpoint_id),
  INDEX idx_invocation_id (invocation_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- AI 生成任务表 (ai_generate_tasks)
-- =============================================
CREATE TABLE ai_generate_tasks (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  endpoint_id VARCHAR(36),
  task_id VARCHAR(255) NOT NULL,
  api_key VARCHAR(64),
  model VARCHAR(100),
  prompt TEXT,
  status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
  progress INT DEFAULT 0,
  result_url TEXT,
  result_data JSON,
  error_message TEXT,
  cost INT DEFAULT 0,
  refund_amount INT DEFAULT 0,
  balance_change_type ENUM('consume', 'refund') DEFAULT 'consume',
  balance_change_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_task_id (task_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 兑换码表 (coupons)
-- =============================================
CREATE TABLE coupons (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  amount INT NOT NULL,
  type ENUM('gift', 'purchase', 'activity') DEFAULT 'gift',
  max_uses INT DEFAULT 1,
  used_count INT DEFAULT 0,
  expires_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 插入默认管理员账户
-- 密码: admin123 (需要在应用启动时由应用重新生成正确的hash)
-- =============================================
INSERT INTO users (id, email, name, api_key, password, balance, total_purchased, role)
SELECT UUID(), 'admin@example.com', 'Administrator', REPLACE(UUID(), '-', ''), 
'$2a$10$placeholder', 0, 0, 'admin';

-- =============================================
-- 插入 AI 创作模型
-- =============================================
INSERT INTO api_endpoints (id, name, description, target_url, method, path_prefix, auth_type, price_per_call, rate_limit, timeout, is_active, type, show_in_generate, default_params) VALUES
(UUID(), 'Gemini 3 Pro 图片', '强化一致性，自由多参考图，全面效果升级', 'https://ai.jmyps.com/v1beta/models/gemini-3-pro-image-preview:generateContent', 'POST', 'gemini-3-pro-image', 'bearer', 100, 10, 600000, TRUE, 'image', TRUE, '{"resolution": {"label": "分辨率", "default": "2K", "options": [{"value": "4K", "label": "4K 超清"}, {"value": "2K", "label": "2K 高清"}, {"value": "1K", "label": "1K 标准"}]}, "aspectRatio": {"label": "画面比例", "default": "3:4", "options": [{"value": "3:4", "label": "3:4"}, {"value": "16:9", "label": "16:9"}, {"value": "1:1", "label": "1:1"}, {"value": "9:16", "label": "9:16"}]}, "numImages": {"label": "生成数量", "default": 2, "options": [1, 2, 4]}}'),

(UUID(), 'Veo 3.1 视频', '高质量视频生成', 'https://ai.jmyps.com/v1beta/models/veo-3-1-preview:generateContent', 'POST', 'veo3.1', 'bearer', 500, 5, 600000, TRUE, 'video', TRUE, '{"model": {"label": "模型", "default": "veo_3_1-fast-4K", "options": [{"value": "veo_3_1-components-4K", "label": "Veo 3.1 Components 4K"}, {"value": "veo_3_1-4K", "label": "Veo 3.1 4K"}, {"value": "veo_3_1-fast-4K", "label": "Veo 3.1 Fast 4K"}, {"value": "veo_3_1-fast-components-4K", "label": "Veo 3.1 Fast Components 4K"}]}, "aspectRatio": {"label": "画面比例", "default": "16:9", "options": [{"value": "16:9", "label": "16:9"}, {"value": "9:16", "label": "9:16"}, {"value": "1:1", "label": "1:1"}]}, "size": {"label": "分辨率", "default": "1080P", "options": [{"value": "1080P", "label": "1080P"}]}}'),

(UUID(), 'Grok 3.1 视频', 'Grok AI 视频生成', 'https://ai.jmyps.com/v1/models/grok-3-video', 'POST', 'grok3.1', 'bearer', 500, 5, 600000, TRUE, 'video', TRUE, '{"model": {"label": "秒数", "default": "grok-video-3", "options": [{"value": "grok-video-3", "label": "6s"}, {"value": "grok-video-3-10s", "label": "10s"}, {"value": "grok-video-3-15s", "label": "15s"}]}, "aspectRatio": {"label": "画面比例", "default": "3:2", "options": [{"value": "3:2", "label": "3:2"}, {"value": "16:9", "label": "16:9"}, {"value": "9:16", "label": "9:16"}, {"value": "1:1", "label": "1:1"}]}, "size": {"label": "分辨率", "default": "1080P", "options": [{"value": "1080P", "label": "1080P"}, {"value": "720P", "label": "720P"}]}}');