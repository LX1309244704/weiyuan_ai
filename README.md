# OpenClaw Skill 市场

基于产品需求文档构建的 Skill 分发与商业化变现平台。

## 技术栈

- **前端**: React + Vite + Zustand
- **后端**: Node.js + Express
- **数据库**: MySQL + Sequelize ORM
- **缓存**: Redis (ioredis) - 高性能计费

## 项目结构

```
├── server/                 # 后端服务
│   ├── src/
│   │   ├── config/        # 数据库和 Redis 配置
│   │   ├── models/        # Sequelize 模型
│   │   ├── routes/       # API 路由
│   │   └── index.js      # 入口文件
│   ├── package.json
│   └── .env.example
│
├── client/                 # 前端应用
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── components/   # 通用组件
│   │   ├── context/      # 状态管理
│   │   ├── utils/        # 工具函数
│   │   └── styles/       # 样式文件
│   ├── package.json
│   └── vite.config.js
│
├── start.bat              # Windows 一键启动脚本
├── start.ps1             # PowerShell 一键启动脚本
└── 产品.md                # 产品需求文档
```

## 快速启动

### Windows 一键启动

双击运行 `start.bat` 即可自动完成以下操作：
1. 检查 Node.js、MySQL、Redis
2. 创建数据库（如果不存在）
3. 复制配置文件
4. 安装依赖
5. 启动后端 + 前端服务

### 手动启动

```bash
# 安装依赖
cd server && npm install
cd ../client && npm install

# 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env 填写数据库密码

# 启动后端
cd server && npm run dev

# 启动前端 (新开终端)
cd client && npm run dev
```

## 核心功能

### 后端 API

| 模块 | 路由 | 说明 |
|------|------|------|
| 认证 | `/api/auth` | 注册、登录、JWT |
| 用户 | `/api/users` | 余额、API Key 管理 |
| Skills | `/api/skills` | 技能列表、详情 |
| 订单 | `/api/orders` | 创建订单、查询 |
| 计费 | `/api/billing` | 高性能扣费 (Redis) |
| 支付 | `/api/payment` | 微信/支付宝回调 |
| 管理 | `/api/admin` | 仪表盘、用户管理 |

### 高性能计费 (产品需求: 5000 QPS)

- **Redis 原子操作**: 余额扣减使用 `DECRBY`，保证不超扣
- **幂等性**: 通过 `invocationId` 防止重复扣费
- **异步写入**: 调用流水异步写入数据库，避免数据库瓶颈
- **缓存一致性**: 每日对账机制，发现不一致自动修复

### 前端页面

- 首页 / Skill 市场
- Skill 详情页 + 购买
- 个人中心 (API Key、余额明细、订单、调用记录)
- 管理后台 (仪表盘、Skill/订单/用户管理、对账)

## 环境配置

### 前置要求

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

### 环境变量 (server/.env)

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=skill_marketplace
DB_USER=root
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here
PORT=3000

# 可选：管理员账户配置
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

## 账户说明

### 普通用户

- 注册：访问 http://localhost:5173/register
- 登录：访问 http://localhost:5173/login
- 登录后可购买积分包、获取 API Key

### 管理员

系统会自动创建默认管理员账户：

| 属性 | 默认值 |
|------|--------|
| 邮箱 | admin@example.com |
| 密码 | admin123 |

**登录方式**：
1. 访问 http://localhost:5173/login
2. 使用管理员邮箱和密码登录
3. 登录后访问 http://localhost:5173/admin 进入管理后台

**修改默认管理员**：
- 通过环境变量修改：`ADMIN_EMAIL` 和 `ADMIN_PASSWORD`
- 或在数据库中修改：`UPDATE users SET role = 'admin' WHERE email = 'your@email.com'`

## 计费 API (OpenClaw Skill 接入)

```javascript
// Skill 代码中调用
const response = await fetch('/api/billing/consume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: '用户APIKey',
    skillId: 'Skill ID',
    invocationId: '唯一调用ID(UUID)'
  })
});

const result = await response.json();

if (result.success) {
  // 扣费成功，remaining 为剩余积分
  console.log('剩余积分:', result.remaining);
} else if (response.status === 402) {
  // 余额不足，引导用户购买
  window.location.href = result.buyLink;
}
```

## 产品需求对照

| 需求 | 实现 |
|------|------|
| 用户注册/登录 | ✓ JWT 认证 |
| Skill 市场展示 | ✓ 首页 + 详情页 |
| 购买积分包 | ✓ 订单 + 支付回调 |
| 个人中心 | ✓ API Key、余额、订单、调用记录 |
| 管理后台 | ✓ 仪表盘、CRUD、对账 |
| 高并发计费 | ✓ Redis 原子操作 (5000 QPS) |
| 幂等性 | ✓ invocationId 防重 |
| 对账机制 | ✓ 缓存与数据库比对 |

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 API | http://localhost:3000 |
| 管理后台 | http://localhost:5173/admin |

## License

MIT
