#!/bin/bash
set -e

echo "=== Building Next.js app ==="
npm run build

echo "=== Running Cloudflare adapter ==="
npx @cloudflare/next-on-pages@1

echo "=== Build complete ==="
