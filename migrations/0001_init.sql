-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,              -- Google sub (唯一ID)
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  credits INTEGER NOT NULL DEFAULT 3, -- 注册赠送3次
  plan TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro'
  plan_expires_at INTEGER,            -- Pro到期时间戳(秒), NULL表示永不过期或无Pro
  total_generations INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 点数变动流水表（用于审计和调试）
CREATE TABLE IF NOT EXISTS credit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,           -- 正数=增加, 负数=消耗
  reason TEXT NOT NULL,             -- 'signup_bonus' | 'generation' | 'purchase' | 'referral'
  ref_id TEXT,                      -- 关联ID（如订单号）
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 邀请关系表（裂变用）
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id TEXT NOT NULL,        -- 邀请人
  referee_id TEXT NOT NULL,         -- 被邀请人
  rewarded INTEGER NOT NULL DEFAULT 0, -- 是否已发放奖励
  created_at INTEGER NOT NULL,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referee_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_credit_logs_user_id ON credit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
