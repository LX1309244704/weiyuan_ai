#!/bin/bash

echo "========================================"
echo "  WeiyuanAI 部署脚本"
echo "========================================"
echo ""

# 确保在项目根目录
cd "$(dirname "$0")"

echo "[1/3] 安装前端依赖并编译..."
cd client
npm install
npm run build
cd ..
echo ""

echo "[2/3] 安装后端依赖..."
cd server
npm install
cd ..
echo ""

echo "[3/3] 创建 .env 文件（如果不存在）..."
if [ ! -f server/.env ]; then
    cat > server/.env << 'EOF'
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=weiyuan_ai
DB_USER=root
DB_PASSWORD=你的MySQL密码

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key_change_this

# 服务
PORT=3000
NODE_ENV=production

# 管理员
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
EOF
    echo "已创建 .env 文件模板，请编辑 server/.env 配置数据库密码"
fi
echo ""

echo "========================================"
echo "  编译完成！"
echo "========================================"
echo ""
echo "前端构建产物: server/public"
echo ""
echo "下一步："
echo "1. 编辑 server/.env 配置数据库密码"
echo "2. 使用宝塔 PM2 或 node src/index.js 启动后端"
echo ""