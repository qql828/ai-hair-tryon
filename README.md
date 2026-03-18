# AI 发型试戴系统

基于 Next.js + Tailwind CSS 实现的 MVP，对接 Stability AI Inpainting API。

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Stability AI API Key

# 本地开发
npm run dev
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `STABILITY_API_KEY` | Stability AI API Key，从 https://platform.stability.ai 获取 |

## 部署到 Cloudflare Pages

```bash
# 安装 Wrangler
npm install -g wrangler

# 构建
npm run build

# 部署
wrangler pages deploy .next
```

在 Cloudflare Pages 控制台设置环境变量 `STABILITY_API_KEY`。

## 用户流程

1. **上传照片** — 支持本地上传或摄像头拍摄，自动裁剪为 1024×1024
2. **标记头发** — 用画笔涂抹头发区域生成遮罩（支持擦除修正）
3. **选择发型** — 12 款预设发型，点击选择
4. **生成效果** — 调用 Stability AI Inpainting，5-10 秒出图
5. **保存对比** — 按住"对比"按钮查看前后效果，一键保存

## 隐私设计

- 图片仅在浏览器内存和 Worker 内存中处理
- 后端严禁写入持久化存储
- 生成完成后图片立即丢弃
