#!/bin/bash
set -e

# 运行 @cloudflare/next-on-pages 构建
npx @cloudflare/next-on-pages@1

# 修复 _worker.js 格式
WORKER_DIR=".vercel/output/static/_worker.js"
if [ -d "$WORKER_DIR" ]; then
  echo "Fixing _worker.js format..."
  mv "$WORKER_DIR" "${WORKER_DIR}.bak"
  cp "${WORKER_DIR}.bak/index.js" "$WORKER_DIR"
  echo "✅ Worker fixed"
fi
