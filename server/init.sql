-- =====================================================
-- Weiyuan AI Database Init SQL
-- =====================================================

CREATE DATABASE IF NOT EXISTS `weiyuan_ai` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `weiyuan_ai`;

-- 删除旧表
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `balance_logs`, `api_invocations`, `ai_generate_tasks`, `invocations`, `orders`, `coupons`, `api_endpoints`, `ai_models`, `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 1. 用户表
-- =====================================================
CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT '用户ID(UUID)',
  `username` VARCHAR(100) NOT NULL COMMENT '用户名',
  `email` VARCHAR(255) COMMENT '邮箱地址',
  `password` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `api_key` VARCHAR(100) COMMENT 'API密钥',
  `balance` INT DEFAULT 0 COMMENT '账户余额(分)',
  `role` ENUM('user','admin') DEFAULT 'user' COMMENT '用户角色',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否激活',
  `last_login_at` DATETIME COMMENT '最后登录时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_api_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 2. API端点配置表（API市场模块）
-- =====================================================
CREATE TABLE `api_endpoints` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'API端点ID(UUID)',
  `name` VARCHAR(100) NOT NULL COMMENT '端点名称',
  `description` TEXT COMMENT '端点描述',
  `category` VARCHAR(50) COMMENT '端点分类',
  `target_url` VARCHAR(500) NOT NULL COMMENT '目标URL地址',
  `method` ENUM('GET','POST','PUT','DELETE','PATCH') DEFAULT 'POST' COMMENT 'HTTP请求方法',
  `path_prefix` VARCHAR(100) NOT NULL COMMENT '路径前缀',
  `auth_type` ENUM('none','api_key','bearer','basic') DEFAULT 'bearer' COMMENT '认证类型',
  `auth_value` TEXT COMMENT '认证凭证值(加密)',
  `headers_mapping` JSON COMMENT '请求头映射配置',
  `request_type` ENUM('runninghub','huoshan') DEFAULT 'runninghub' COMMENT '请求类型',
  `price_per_call` INT DEFAULT 100 COMMENT '每次调用价格(分)',
  `rate_limit` INT DEFAULT 60 COMMENT '速率限制',
  `timeout` INT DEFAULT 30000 COMMENT '超时时间(毫秒)',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `usage_count` INT DEFAULT 0 COMMENT '累计调用次数',
  `type` ENUM('api','image','video') DEFAULT 'api' COMMENT '端点类型',
  `icon` VARCHAR(100) COMMENT '图标',
  `default_params` JSON COMMENT '默认参数',
  `output_fields` JSON COMMENT '输出字段映射',
  `is_generate_tool` TINYINT(1) DEFAULT 0 COMMENT '是否显示高级参数',
  `show_in_generate` TINYINT(1) DEFAULT 0 COMMENT '是否在AI创作显示',
  `created_by` CHAR(36) COMMENT '创建者ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_path_prefix` (`path_prefix`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API端点配置表';

-- =====================================================
-- 3. AI厂商配置表（AI创作模块 - 只存Key）
-- =====================================================
CREATE TABLE `ai_models` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT '配置ID(UUID)',
  `name` VARCHAR(100) NOT NULL COMMENT '显示名称',
  `provider` VARCHAR(50) NOT NULL COMMENT '厂商标识:runninghub,huoshan等',
  `api_key` TEXT COMMENT 'API密钥(加密存储)',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_provider` (`provider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI厂商配置表';

-- =====================================================
-- 4. 订单表
-- =====================================================
CREATE TABLE `orders` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT '订单ID(UUID)',
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `skill_id` CHAR(36) COMMENT '技能ID',
  `amount` INT NOT NULL COMMENT '订单金额(分)',
  `package_size` INT NOT NULL COMMENT '购买积分数量',
  `payment_method` ENUM('wechat','alipay') NOT NULL COMMENT '支付方式',
  `transaction_id` VARCHAR(128) COMMENT '交易流水号',
  `status` ENUM('pending','paid','refunded','cancelled') DEFAULT 'pending' COMMENT '订单状态',
  `paid_at` DATETIME COMMENT '支付时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- =====================================================
-- 5. 余额变动记录表
-- =====================================================
CREATE TABLE `balance_logs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT '记录ID(UUID)',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `change` INT NOT NULL COMMENT '变动金额(分)',
  `reason` VARCHAR(100) NOT NULL COMMENT '变动原因',
  `balance_after` INT NOT NULL COMMENT '变动后余额(分)',
  `type` ENUM('consume','recharge','refund','adjust') NOT NULL COMMENT '变动类型',
  `related_id` CHAR(36) COMMENT '关联业务ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='余额变动记录表';

-- =====================================================
-- 6. API调用记录表
-- =====================================================
CREATE TABLE `api_invocations` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT '记录ID(UUID)',
  `invocation_id` VARCHAR(100) NOT NULL COMMENT '幂等ID',
  `endpoint_id` CHAR(36) NOT NULL COMMENT 'API端点ID',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `cost` INT DEFAULT 0 COMMENT '扣费金额(分)',
  `status` ENUM('success','failed','timeout') DEFAULT 'success' COMMENT '调用状态',
  `error_message` TEXT COMMENT '错误信息',
  `latency` INT DEFAULT 0 COMMENT '响应时间(毫秒)',
  `ip_address` VARCHAR(45) COMMENT '客户端IP',
  `request_path` VARCHAR(500) COMMENT '请求路径',
  `response_code` INT COMMENT '响应状态码',
  `request_body` TEXT COMMENT '请求体',
  `response_body` TEXT COMMENT '响应体',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_invocation_id` (`invocation_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_endpoint_id` (`endpoint_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API调用记录表';

-- =====================================================
-- 6.1 模型调用记录表
-- =====================================================
CREATE TABLE `invocations` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT '记录ID(UUID)',
  `invocation_id` VARCHAR(64) NOT NULL COMMENT '幂等ID',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `model` VARCHAR(100) COMMENT '模型名称',
  `prompt` TEXT COMMENT '输入提示词',
  `response` TEXT COMMENT '模型响应',
  `tokens_used` INT COMMENT '消耗的Token数量',
  `cost` INT DEFAULT 0 COMMENT '消耗金额(分)',
  `duration` INT COMMENT '响应耗时(毫秒)',
  `status` VARCHAR(20) DEFAULT 'success' COMMENT '调用状态',
  `error_message` TEXT COMMENT '错误信息',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_invocation_id` (`invocation_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型调用记录表';

-- =====================================================
-- 7. AI生成任务表
-- =====================================================
CREATE TABLE `ai_generate_tasks` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT '任务ID(UUID)',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `provider` VARCHAR(50) COMMENT '厂商标识',
  `task_id` VARCHAR(255) NOT NULL COMMENT '第三方任务ID',
  `model_name` VARCHAR(100) COMMENT '模型名称',
  `prompt` TEXT COMMENT '用户提示词',
  `image_urls` JSON COMMENT '输入图片URL列表',
  `status` ENUM('queued','processing','completed','failed') DEFAULT 'queued' COMMENT '任务状态',
  `progress` INT DEFAULT 0 COMMENT '进度(0-100)',
  `result_url` TEXT COMMENT '生成结果URL',
  `result_data` JSON COMMENT '完整返回数据',
  `error_message` TEXT COMMENT '错误信息',
  `cost` INT DEFAULT 0 COMMENT '消耗积分',
  `refund_amount` INT DEFAULT 0 COMMENT '返还积分',
  `balance_change_type` ENUM('consume','refund') DEFAULT 'consume' COMMENT '积分变更类型',
  `balance_change_at` DATETIME COMMENT '积分变更时间',
  `poll_attempts` INT DEFAULT 0 COMMENT '轮询尝试次数',
  `deleted_at` DATETIME COMMENT '软删除时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_task_id` (`task_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_provider` (`provider`),
  KEY `idx_status` (`status`),
  KEY `idx_user_created` (`user_id`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI生成任务表';

-- =====================================================
-- 8. 积分激活码表
-- =====================================================
CREATE TABLE `coupons` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT '激活码ID(UUID)',
  `code` VARCHAR(20) NOT NULL COMMENT '激活码(唯一)',
  `amount` INT NOT NULL COMMENT '兑换积分数量',
  `type` ENUM('gift','purchase','activity') DEFAULT 'gift' COMMENT '类型',
  `max_uses` INT DEFAULT 1 COMMENT '最大使用次数',
  `used_count` INT DEFAULT 0 COMMENT '已使用次数',
  `expires_at` DATETIME COMMENT '过期时间',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否激活',
  `created_by` CHAR(36) COMMENT '创建者ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分激活码表';

-- =====================================================
-- 初始数据
-- =====================================================

-- 用户由服务器启动时自动创建
-- 默认: admin@example.com / admin123
-- 测试: test@example.com / test123

-- AI厂商配置（API Key 需要管理员在后台配置）
INSERT INTO `ai_models` (`id`, `name`, `provider`, `api_key`, `is_active`, `created_at`, `updated_at`) VALUES 
('10000000-0000-0000-0000-000000000001', 'RunningHub', 'runninghub', '', 1, NOW(), NOW()),
('10000000-0000-0000-0000-000000000002', '火山引擎', 'huoshan', '', 1, NOW(), NOW());

-- 积分激活码
INSERT INTO `coupons` (`id`, `code`, `amount`, `type`, `max_uses`, `used_count`, `is_active`, `created_at`, `updated_at`) VALUES 
('30000000-0000-0000-0000-000000000001', 'WELCOME1000', 1000, 'gift', 100, 0, 1, NOW(), NOW()),
('30000000-0000-0000-0000-000000000002', 'VIP5000', 5000, 'gift', 50, 0, 1, NOW(), NOW()),
('30000000-0000-0000-0000-000000000003', 'TEST500', 500, 'gift', NULL, 0, 1, NOW(), NOW());

SELECT 'Database initialized successfully!' AS status;
