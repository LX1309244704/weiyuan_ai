# Weiyuan AI

Weiyuan AI 是一个集成了 AI 生成功能（图片/视频）的综合性平台，提供技能市场、API 市场、AI 创作等核心功能。

## ✨ 功能特性

### 核心功能
- **AI 创作** - 支持图片/视频生成，可配置多种 AI 模型
- **技能市场** - 浏览、购买、安装各类技能插件
- **API 市场** - 统一的 API 调用接口，支持多种 AI 服务
- **生成记录** - 查看历史生成记录和资源管理
- **个人中心** - 账户管理、订单记录、调用记录、积分充值

### 管理后台
- 仪表盘统计
- Skill 管理
- API 端点管理
- 订单管理
- 用户管理
- 财务统计
- 系统设置

## 🏗️ 技术栈

### 前端
- **框架**: React 18 + Vite
- **状态管理**: Zustand
- **路由**: React Router DOM 6
- **HTTP 客户端**: Axios
- **图标库**: Lucide React
- **CSS**: 自定义 CSS 变量（白色主题）

### 后端
- **运行时**: Node.js
- **框架**: Express
- **数据库**: MySQL + Sequelize ORM
- **缓存**: Redis
- **认证**: JWT
- **文件上传**: Multer
- **安全**: Helmet, express-rate-limit

## 📦 安装

### 环境要求
- Node.js >= 18.x
- MySQL >= 8.0
- Redis >= 6.0

### 1. 克隆项目
```bash
git clone https://github.com/LX1309244704/weiyuan_ai.git
cd weiyuan_ai
```

### 2. 安装前端依赖
```bash
cd client
npm install
```

### 3. 安装后端依赖
```bash
cd server
npm install
```

### 4. 配置环境变量

后端配置（`server/.env`）：
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=weiyuan_ai
DB_USER=root
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 密钥
JWT_SECRET=your_jwt_secret_key_change_in_production

# 服务器配置
PORT=3000
NODE_ENV=development

# 支付配置（微信支付）
WECHAT_MCH_ID=your_mch_id
WECHAT_API_KEY=your_wechat_api_key

# 支付配置（支付宝）
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=alipay_public_key
```

### 5. 数据库初始化

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE weiyuan_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 运行数据库迁移
cd server
node migrate.js
```

## 🚀 运行

### 开发模式

启动后端服务：
```bash
cd server
npm run dev
```

启动前端开发服务器：
```bash
cd client
npm run dev
```

访问：http://localhost:5173

### 生产模式

构建前端：
```bash
cd client
npm run build
```

启动后端（包含静态文件服务）：
```bash
cd server
npm start
```

访问：http://localhost:3000

## 📁 项目结构

```
weiyuan_ai/
├── client/                     # 前端项目
│   ├── src/
│   │   ├── components/         # 公共组件
│   │   │   ├── admin/          # 管理后台组件
│   │   │   ├── generate/       # AI 生成组件
│   │   │   ├── Layout.jsx      # 通用布局
│   │   │   ├── Modal.jsx       # 模态框
│   │   │   └── TopNavigationBar.jsx  # 顶部导航栏
│   │   ├── context/            # React Context
│   │   │   └── AuthContext.jsx # 认证上下文
│   │   ├── pages/              # 页面组件
│   │   │   ├── HomeNew.jsx     # 技能市场
│   │   │   ├── ApiListNew.jsx  # API 市场
│   │   │   ├── GenerateNew.jsx # AI 创作
│   │   │   ├── ProfileNew.jsx  # 个人中心
│   │   │   └── ...
│   │   ├── styles/             # 全局样式
│   │   │   ├── generate.css    # AI 生成页面样式
│   │   │   └── global.css      # 全局样式
│   │   ├── utils/              # 工具函数
│   │   │   └── api.js          # API 请求封装
│   │   ├── App.jsx             # 路由配置
│   │   └── main.jsx            # 入口文件
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # 后端项目
│   ├── src/
│   │   ├── config/             # 配置文件
│   │   │   ├── database.js     # 数据库配置
│   │   │   └── redis.js        # Redis 配置
│   │   ├── models/             # 数据模型
│   │   │   ├── User.js         # 用户模型
│   │   │   ├── Skill.js        # 技能模型
│   │   │   ├── Order.js        # 订单模型
│   │   │   ├── ApiEndpoint.js  # API 端点模型
│   │   │   └── ...
│   │   ├── routes/             # 路由
│   │   │   ├── auth.js         # 认证路由
│   │   │   ├── skills.js       # 技能路由
│   │   │   ├── orders.js       # 订单路由
│   │   │   ├── generate.js     # AI 生成路由
│   │   │   ├── admin.js        # 管理后台路由
│   │   │   └── ...
│   │   ├── utils/              # 工具函数
│   │   │   ├── encryption.js   # 加密工具
│   │   │   └── storage.js      # 存储工具
│   │   └── index.js            # 入口文件
│   ├── public/                 # 静态资源
│   ├── uploads/                # 上传文件
│   ├── init.sql                # 数据库初始化脚本
│   ├── migrate.js              # 数据库迁移脚本
│   └── package.json
│
├── README.md
└── .gitignore
```

## 🔑 API 接口

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册

### 技能接口
- `GET /api/skills` - 获取技能列表
- `GET /api/skills/:id` - 获取技能详情
- `GET /api/skills/:id/install` - 安装技能

### API 市场
- `GET /api/proxy/endpoints` - 获取 API 端点列表
- `POST /api/proxy/:endpoint` - 调用 API

### AI 生成
- `POST /api/generate/image` - 生成图片
- `POST /api/generate/video` - 生成视频

### 用户接口
- `GET /api/users/me` - 获取当前用户信息
- `GET /api/users/balance-logs` - 获取余额变动记录
- `GET /api/users/orders` - 获取订单记录
- `GET /api/users/invocations` - 获取调用记录

## 💰 积分系统

- 充值比例：¥1 = 100 积分
- 技能/价格：按次计费
- API 调用：按次计费

## 📝 开发说明

### 添加新的 AI 生成模型

1. 在 `client/src/pages/GenerateNew.jsx` 的 `MODELS` 数组中添加新模型
2. 在后端 `server/src/routes/generate.js` 添加对应的生成逻辑
3. 在管理后台配置 API 端点

### 自定义主题颜色

编辑 `client/src/styles/generate.css` 中的 CSS 变量：

```css
:root {
  --ai-bg-primary: #ffffff;
  --ai-bg-secondary: #f9fafb;
  --ai-accent-green: #10b981;
  --ai-accent-blue: #3b82f6;
  /* ... */
}
```

## 🛡️ 安全

- JWT 身份验证
- 密码 bcrypt 加密
- 请求速率限制
- CORS 跨域保护
- SQL 注入防护（Sequelize ORM）

## 📄 License

MIT

## 👥 联系方式

- GitHub: https://github.com/LX1309244704/weiyuan_ai
- 问题反馈：请在 GitHub 提交 Issue
