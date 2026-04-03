# AI Hair Try-On 项目现状 (2026-04-02)

## 技术栈
Next.js 15 + React 19 + Cloudflare Pages + D1 + Edge Runtime

## 已完成功能

### 1. 用户体系 (D1数据库)
- **表结构**: users, credit_logs, referrals
- **注册赠3次**: Google OAuth登录后自动创建用户
- **点数系统**: 免费3次终身，Pro无限
- **邀请裂变**: 支持 `/api/auth/login?ref=userId`，双方各得2次

### 2. 核心API
- `POST /api/generate`: 鉴权+扣点+调用Stability AI
- `GET /api/auth/me`: 返回 {email, name, picture, plan, credits, totalGenerations}
- `GET /api/auth/callback`: 处理OAuth+注册+邀请奖励

### 3. 前端页面
- **首页 `/`**: 上传→标记→选发型→生成，显示剩余点数，点数不足弹窗
- **定价页 `/pricing`**: Free/Pro月付/Pro年付 + 点数包(10/50/200次) + FAQ
- **组件**: `UpgradeModal`(升级弹窗), `LangToggle`(中英切换)

### 4. 国际化 (i18n)
- `lib/i18n.tsx`: 中英文翻译，localStorage持久化
- 所有页面支持切换，右上角按钮

## 关键配置
- **D1**: `wrangler.toml` 绑定 `ai-hair-tryon-db` (uuid: 3bedc928...)
- **环境变量**: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, STABILITY_API_KEY
- **域名**: hairtryon.shop (Cloudflare Pages + GoDaddy)

## 待实现
- Stripe支付 (定价页按钮目前是alert占位)
- 个人中心 `/profile`
- R2历史记录 (Pro专属)

## 数据库迁移
`migrations/0001_init.sql` 已执行到生产环境
