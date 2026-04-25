#!/bin/bash

echo "🚀 Ming - Installation Script"
echo "======================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18 first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# 检查 Python (用于日报生成)
if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python 3 is not installed. Daily report generation may not work."
else
    echo "✅ Python 3 version: $(python3 --version)"
fi

# 安装依赖
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# 构建主进程
echo ""
echo "🔨 Building main process..."
npm run build:main

if [ $? -ne 0 ]; then
    echo "❌ Failed to build main process"
    exit 1
fi

echo "✅ Main process built successfully"

echo ""
echo "✨ Installation completed!"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo ""
echo "🎉 Happy coding with Ming!"
