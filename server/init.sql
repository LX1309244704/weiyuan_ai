-- =============================================
-- Weiyuan AI 初始化 SQL 脚本
-- 数据库: weiyuan_ai
-- 创建时间: 2024
-- =============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS weiyuan_ai 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE weiyuan_ai;

-- =============================================
-- 用户表
-- =============================================
CREATE TABLE IF NOT EXISTS users (
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
-- Skill 技能表
-- =============================================
CREATE TABLE IF NOT EXISTS skills (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(500),
  category VARCHAR(50),
  price_per_call INT DEFAULT 100,
  package_sizes JSON DEFAULT ('[{"size": 100, "price": 5000}, {"size": 500, "price": 20000}, {"size": 1000, "price": 35000}]'),
  file_url VARCHAR(500),
  package_url VARCHAR(500) COMMENT 'OSS or local storage URL for skill package (.zip)',
  version VARCHAR(20) DEFAULT '1.0.0',
  author VARCHAR(100),
  readme TEXT COMMENT 'Markdown format installation guide',
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
-- 订单表
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  user_id VARCHAR(36) NOT NULL,
  skill_id VARCHAR(36),
  amount INT NOT NULL COMMENT '金额(分)',
  package_size INT NOT NULL COMMENT '积分数量',
  payment_method ENUM('wechat', 'alipay') NOT NULL,
  transaction_id VARCHAR(128),
  status ENUM('pending', 'paid', 'refunded', 'cancelled') DEFAULT 'pending',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 调用记录表 (Skill)
-- =============================================
CREATE TABLE IF NOT EXISTS invocations (
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
-- 余额变动日志表
-- =============================================
CREATE TABLE IF NOT EXISTS balance_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  `change` INT NOT NULL COMMENT '变动数量，正数增加，负数减少',
  reason VARCHAR(100) NOT NULL,
  balance_after INT NOT NULL COMMENT '变动后余额',
  related_id VARCHAR(36) COMMENT '关联订单ID或调用ID',
  type ENUM('purchase', 'consume', 'refund', 'adjustment') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- API 端点表
-- =============================================
CREATE TABLE IF NOT EXISTS api_endpoints (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  target_url VARCHAR(500) NOT NULL COMMENT '目标API地址',
  method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') DEFAULT 'POST',
  path_prefix VARCHAR(100) NOT NULL COMMENT '暴露路径前缀',
  auth_type ENUM('none', 'api_key', 'bearer', 'basic') DEFAULT 'bearer' COMMENT '认证类型',
  auth_value TEXT COMMENT '加密存储的认证值',
  headers_mapping JSON DEFAULT ('{}') COMMENT '请求头映射配置',
  request_example TEXT COMMENT '请求参数示例',
  response_example TEXT COMMENT '响应格式示例',
  price_per_call INT DEFAULT 100 COMMENT '每次调用价格(分)',
  rate_limit INT DEFAULT 60 COMMENT '每分钟请求数限制',
  timeout INT DEFAULT 30000 COMMENT '请求超时时间(ms)',
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  type ENUM('api', 'image', 'video') DEFAULT 'api' COMMENT '端点类型: api=普通API, image=图片生成, video=视频生成',
  icon VARCHAR(100) COMMENT '图标(如: 🖼️, 🎬)',
  default_params JSON DEFAULT ('{}') COMMENT '生成工具默认参数',
  output_fields JSON DEFAULT ('{}') COMMENT '输出字段映射',
  is_generate_tool BOOLEAN DEFAULT FALSE COMMENT '是否为AI生成工具',
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_path_prefix (path_prefix),
  INDEX idx_is_active (is_active),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- API 调用记录表
-- =============================================
CREATE TABLE IF NOT EXISTS api_invocations (
  id VARCHAR(36) PRIMARY KEY,
  invocation_id VARCHAR(100) NOT NULL UNIQUE COMMENT '幂等ID',
  endpoint_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  cost INT DEFAULT 0 COMMENT '扣费金额(分)',
  status ENUM('success', 'failed', 'timeout') DEFAULT 'success',
  error_message TEXT,
  latency INT DEFAULT 0 COMMENT '响应时间(ms)',
  ip_address VARCHAR(45),
  request_path VARCHAR(500),
  response_code INT COMMENT '目标API响应状态码',
  request_body TEXT COMMENT '请求体',
  response_body TEXT COMMENT '响应体',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (endpoint_id) REFERENCES api_endpoints(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_endpoint_id (endpoint_id),
  INDEX idx_user_id (user_id),
  INDEX idx_invocation_id (invocation_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 插入默认管理员账户
-- 密码: admin123 (bcrypt加密)
-- =============================================
INSERT INTO users (id, email, name, api_key, password, balance, total_purchased, role)
VALUES (
  UUID(),
  'admin@example.com',
  'Administrator',
  REPLACE(UUID(), '-', ''),
  '$2a$10$rQZ9QxQxQxQxQxQxQxQxQOZJ9QxQxQxQxQxQxQxQxQxQxQxQxQxQx',
  0,
  0,
  'admin'
) ON DUPLICATE KEY UPDATE role = 'admin';

-- =============================================
-- 插入示例 Skill 数据
-- =============================================
INSERT INTO skills (id, name, description, category, price_per_call, is_active) VALUES
(UUID(), 'AI 文本生成', '基于大语言模型的文本生成服务', 'AI助手', 100, TRUE),
(UUID(), '图像风格转换', '将图片转换为不同艺术风格', '创意工具', 200, TRUE),
(UUID(), '代码助手', '智能代码补全和生成', '开发者', 150, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================
-- 插入 RunningHub API 端点
-- =============================================
INSERT INTO api_endpoints (id, name, description, category, target_url, method, path_prefix, auth_type, price_per_call, is_active, type, is_generate_tool) VALUES
(UUID(), 'RunningHub AI应用', 'RunningHub 云端 ComfyUI 工作流 API', 'ComfyUI', 'https://www.runninghub.cn/openapi/v2/run/ai-app/2004879210508419073', 'POST', 'runninghub/ai-app', 'bearer', 100, TRUE, 'api', FALSE),
(UUID(), 'RunningHub 查询任务', '查询 RunningHub 任务状态', 'ComfyUI', 'https://www.runninghub.cn/openapi/v2/query', 'POST', 'runninghub/query', 'bearer', 50, TRUE, 'api', FALSE),
(UUID(), 'RunningHub 文件上传', '上传本地文件到 RunningHub', 'ComfyUI', 'https://www.runninghub.cn/openapi/v2/media/upload/binary', 'POST', 'runninghub/upload', 'bearer', 50, TRUE, 'api', FALSE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================
-- 插入示例 API 端点
-- =============================================
INSERT INTO api_endpoints (id, name, description, category, target_url, method, path_prefix, auth_type, price_per_call, is_active) VALUES
(UUID(), 'OpenAI Chat', 'OpenAI GPT 对话接口', 'AI对话', 'https://api.openai.com/v1/chat/completions', 'POST', 'openai/chat', 'bearer', 100, TRUE),
(UUID(), '图像生成', 'AI 图像生成服务', '图像生成', 'https://api.example.com/v1/images/generations', 'POST', 'image/generate', 'bearer', 200, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================
-- 插入示例生成工具（图片/视频）
-- =============================================
INSERT INTO api_endpoints (id, name, description, category, target_url, method, path_prefix, auth_type, price_per_call, is_active, type, icon, is_generate_tool, default_params, output_fields) VALUES
(UUID(), '文生图', '根据文字描述生成图片', '图片生成', 'https://api.example.com/v1/text2image', 'POST', 'generate/image', 'bearer', 100, TRUE, 'image', '🖼️', TRUE, '{"aspectRatio": "1:1", "numImages": 4}', '{"result": "data[0].url"}'),
(UUID(), '图生图', '上传图片+描述生成新图片', '图片生成', 'https://api.example.com/v1/img2img', 'POST', 'generate/img2img', 'bearer', 150, TRUE, 'image', '🔄', TRUE, '{"aspectRatio": "1:1", "numImages": 4}', '{"result": "data[0].url"}'),
(UUID(), '文生视频', '根据文字描述生成视频', '视频生成', 'https://api.example.com/v1/text2video', 'POST', 'generate/video', 'bearer', 500, TRUE, 'video', '🎬', TRUE, '{"duration": 5, "fps": 24}', '{"result": "data[0].url"}'),
(UUID(), '图生视频', '上传图片生成视频', '视频生成', 'https://api.example.com/v1/img2video', 'POST', 'generate/img2video', 'bearer', 400, TRUE, 'video', '📹', TRUE, '{"duration": 5, "fps": 24}', '{"result": "data[0].url"}')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================
-- 创建视图: 用户统计
-- =============================================
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.balance,
  u.total_purchased,
  COUNT(DISTINCT o.id) as order_count,
  COUNT(DISTINCT i.id) as invocation_count,
  SUM(i.cost) as total_cost
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid'
LEFT JOIN invocations i ON u.id = i.user_id
GROUP BY u.id, u.email, u.name, u.balance, u.total_purchased;

-- =============================================
-- 创建视图: API 端点统计
-- =============================================
CREATE OR REPLACE VIEW v_endpoint_stats AS
SELECT 
  e.id,
  e.name,
  e.category,
  e.price_per_call,
  e.usage_count,
  COUNT(ai.id) as total_calls,
  SUM(ai.cost) as total_revenue,
  AVG(ai.latency) as avg_latency,
  SUM(CASE WHEN ai.status = 'success' THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN ai.status != 'success' THEN 1 ELSE 0 END) as fail_count
FROM api_endpoints e
LEFT JOIN api_invocations ai ON e.id = ai.endpoint_id
GROUP BY e.id, e.name, e.category, e.price_per_call, e.usage_count;

-- =============================================
-- 完成
-- =============================================
SELECT 'Database initialization completed!' as message;
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as skills_count FROM skills;
SELECT COUNT(*) as endpoints_count FROM api_endpoints;

-- =============================================
-- 更新数据库结构（如需要）
-- =============================================
-- 为 api_endpoints 添加示例字段
-- 注意：MySQL 不支持 IF NOT EXISTS，需要手动判断或忽略错误
-- ALTER TABLE api_endpoints ADD COLUMN request_example TEXT;
-- ALTER TABLE api_endpoints ADD COLUMN response_example TEXT;

-- 为 api_invocations 添加请求/响应体字段
-- ALTER TABLE api_invocations ADD COLUMN request_body TEXT;
-- ALTER TABLE api_invocations ADD COLUMN response_body TEXT;

-- =============================================
-- 安全的字段添加脚本（会自动忽略已存在的字段）
-- =============================================
DELIMITER //

DROP PROCEDURE IF EXISTS add_column_if_not_exists//
CREATE PROCEDURE add_column_if_not_exists()
BEGIN
    -- api_endpoints 表
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_endpoints' AND COLUMN_NAME = 'request_example') THEN
        ALTER TABLE api_endpoints ADD COLUMN request_example TEXT COMMENT '请求参数示例';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_endpoints' AND COLUMN_NAME = 'response_example') THEN
        ALTER TABLE api_endpoints ADD COLUMN response_example TEXT COMMENT '响应格式示例';
    END IF;
    
    -- 添加生成工具相关字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_endpoints' AND COLUMN_NAME = 'type') THEN
        ALTER TABLE api_endpoints ADD COLUMN type ENUM('api', 'image', 'video') DEFAULT 'api' COMMENT '端点类型';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_endpoints' AND COLUMN_NAME = 'icon') THEN
        ALTER TABLE api_endpoints ADD COLUMN icon VARCHAR(100) COMMENT '图标';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_endpoints' AND COLUMN_NAME = 'default_params') THEN
        ALTER TABLE api_endpoints ADD COLUMN default_params JSON DEFAULT ('{}') COMMENT '生成工具默认参数';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_endpoints' AND COLUMN_NAME = 'output_fields') THEN
        ALTER TABLE api_endpoints ADD COLUMN output_fields JSON DEFAULT ('{}') COMMENT '输出字段映射';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_endpoints' AND COLUMN_NAME = 'is_generate_tool') THEN
        ALTER TABLE api_endpoints ADD COLUMN is_generate_tool BOOLEAN DEFAULT FALSE COMMENT '是否为AI生成工具';
    END IF;
    
    -- api_invocations 表
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_invocations' AND COLUMN_NAME = 'request_body') THEN
        ALTER TABLE api_invocations ADD COLUMN request_body TEXT COMMENT '请求体';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_invocations' AND COLUMN_NAME = 'response_body') THEN
        ALTER TABLE api_invocations ADD COLUMN response_body TEXT COMMENT '响应体';
    END IF;
    
    SELECT 'Database columns updated successfully!' as message;
END//

DELIMITER ;

-- 执行存储过程
CALL add_column_if_not_exists();

-- 删除存储过程
DROP PROCEDURE IF EXISTS add_column_if_not_exists;