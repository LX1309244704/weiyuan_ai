@echo off
echo ========================================
echo   WeiyuanAI 一键编译脚本
echo ========================================
echo.

echo [1/3] 安装前端依赖...
cd /d "%~dp0client"
call npm install
if errorlevel 1 (
    echo 前端依赖安装失败！
    pause
    exit /b 1
)
echo.

echo [2/3] 编译前端...
call npm run build
if errorlevel 1 (
    echo 前端编译失败！
    pause
    exit /b 1
)
echo.

echo [3/3] 安装后端依赖...
cd /d "%~dp0server"
call npm install
if errorlevel 1 (
    echo 后端依赖安装失败！
    pause
    exit /b 1
)
echo.

echo ========================================
echo   编译完成！
echo ========================================
echo.
echo 输出目录: server\public
echo.
echo 部署到宝塔:
echo   1. 上传整个 weiyuan_ai 文件夹到服务器
echo   2. 在 server 目录创建 .env 文件
echo   3. 宝塔网站配置 Node.js 指向 server\src\index.js
echo.