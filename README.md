# Weiyuan AI

Weiyuan AI 是一个集成了 AI 图片/视频生成功能的综合性平台，提供 AI 创作、API 市场、积分系统等核心功能。

## 功能特性

### AI 创作
- **图片生成** - 香蕉Pro 模型，支持文生图和图生图
- **视频生成** - VEO3.1 模型，支持文生视频、首尾帧、图生视频
- **生成历史** - 分类查看、放大预览、下载、删除
- **实时状态** - SSE 推送生成进度

### API 市场
- 统一的 API 调用接口
- 支持多种 AI 服务端点
- 按次计费

### 积分系统
- 充值比例：¥1 = 100 积分
- 实时扣费，支持退款
- 余额明细记录

### 兑换码功能
- 管理员创建积分激活码
- 用户兑换获取积分
- 记录兑换者信息

### 管理后台
- 仪表盘统计
- AI 模型配置
- API 端点管理
- 用户管理
- 订单管理
- 兑换码管理
- 财务统计

## 技术栈

### 前端
- React 18 + Vite
- Zustand（状态管理）
- React Router DOM 6
- Axios
- Lucide React（图标）

### 后端
- Node.js + Express
- Sequelize ORM
- MySQL 8.0
- Redis
- BullMQ（任务队列）
- JWT 认证

## 安装

### 环境要求
- Node.js >= 18.x
- MySQL >= 8.0
- Redis >= 6.0

### 1. 克隆项目
```bash
git clone https://github.com/LX1309244704/weiyuan_ai.git
cd weiyuan_ai
```

### 2. 安装依赖
```bash
# 前端
cd client
npm install

# 后端
cd ../server
npm install
```

### 3. 配置环境变量

创建 `server/.env` 文件：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=weiyuan_ai
DB_USER=root
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key

# 服务
PORT=3000
NODE_ENV=development

# 支付（可选）
WECHAT_MCH_ID=
WECHAT_API_KEY=
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
```

### 4. 初始化数据库
```bash
mysql -u root -p < server/init.sql
```

## 运行

### 开发模式
```bash
# 后端
cd server
npm run dev

# 前端（新终端）
cd client
npm run dev
```

访问：http://localhost:5173

### 生产模式
```bash
# 构建前端
cd client
npm run build

# 启动后端
cd ../server
npm start
```

访问：http://localhost:3000

## 项目结构

```
weiyuan_ai/
├── client/                      # 前端
│   ├── src/
│   │   ├── components/          # 组件
│   │   │   ├── admin/          # 管理后台组件
│   │   │   ├── generate/       # AI 创作组件
│   │   │   └── TopNavigationBar.jsx
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # 页面
│   │   ├── styles/             # 样式
│   │   └── utils/              # 工具
│   └── package.json
│
├── server/                      # 后端
│   ├── src/
│   │   ├── config/             # 配置
│   │   │   ├── database.js     # 数据库
│   │   │   ├── queue.js        # BullMQ 队列
│   │   │   └── redis.js        # Redis
│   │   ├── models/             # 数据模型
│   │   ├── providers/          # AI 厂商处理器
│   │   │   ├── base.js         # 基类
│   │   │   ├── runninghub.js   # RunningHub
│   │   │   └── huoshan.js      # 火山引擎
│   │   ├── routes/             # 路由
│   │   ├── utils/              # 工具
│   │   └── index.js            # 入口
│   ├── init.sql                # 数据库初始化
│   └── package.json
│
└── README.md
```

## API 接口

### 认证
```
POST /api/auth/login          # 登录
POST /api/auth/register       # 注册
GET  /api/auth/me             # 当前用户
```

### AI 创作
```
POST /api/ai-generate/:model  # 生成内容
GET  /api/ai-generate/tasks   # 任务列表
GET  /api/ai-generate/stream  # SSE 实时状态
DEL  /api/ai-generate/task/:id # 删除任务
```

### 用户
```
GET /api/users/me             # 用户信息
GET /api/users/balance-logs   # 余额明细
```

### 兑换码
```
POST /api/coupon/create       # 创建兑换码（管理员）
GET  /api/coupon/list         # 兑换码列表
POST /api/coupon/redeem       # 兑换积分
```

### 管理后台
```
GET /api/admin/stats          # 统计数据
GET /api/admin/users          # 用户列表
GET /api/admin/orders         # 订单列表
GET /api/admin/ai-models      # AI 模型配置
```

## AI 模型配置

在管理后台配置 AI 厂商的 API Key：

| 厂商 | 模型 | 功能 |
|------|------|------|
| RunningHub | 香蕉Pro | 图片生成 |
| RunningHub | VEO3.1 | 视频生成 |

## 安全

- JWT 身份认证
- 密码 bcrypt 加密
- 请求速率限制
- SQL 注入防护（Sequelize ORM）

## License

MIT