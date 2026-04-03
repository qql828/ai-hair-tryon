-- 订单表（点数包一次性购买）
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,              -- PayPal order ID
  user_id TEXT NOT NULL,
  product_type TEXT NOT NULL,       -- 'credits_10' | 'credits_50' | 'credits_200'
  amount TEXT NOT NULL,             -- 金额字符串，如 "1.90"
  credits INTEGER NOT NULL,         -- 购买的点数
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'cancelled'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,              -- PayPal subscription ID
  user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,          -- 'pro_monthly' | 'pro_yearly'
  plan_id TEXT NOT NULL,            -- PayPal plan ID
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'cancelled' | 'suspended'
  current_period_end INTEGER,       -- 当前订阅周期结束时间戳(秒)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
