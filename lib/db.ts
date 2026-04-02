export const runtime = "edge";

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  credits: number;
  plan: "free" | "pro";
  plan_expires_at: number | null;
  total_generations: number;
  created_at: number;
  updated_at: number;
}

export type CreditReason =
  | "signup_bonus"
  | "generation"
  | "purchase"
  | "referral";

// 查找用户
export async function findUser(db: D1Database, id: string): Promise<User | null> {
  const result = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first<User>();
  return result ?? null;
}

// 查找用户（by email）
export async function findUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first<User>();
  return result ?? null;
}

// 创建新用户（注册时调用，赠送3次）
export async function createUser(
  db: D1Database,
  data: { id: string; email: string; name: string; picture: string }
): Promise<User> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO users (id, email, name, picture, credits, plan, plan_expires_at, total_generations, created_at, updated_at)
       VALUES (?, ?, ?, ?, 3, 'free', NULL, 0, ?, ?)`
    )
    .bind(data.id, data.email, data.name, data.picture, now, now)
    .run();

  // 记录注册赠送流水
  await addCreditLog(db, data.id, 3, "signup_bonus", null);

  return (await findUser(db, data.id))!;
}

// 更新用户信息（头像/名字可能变化）
export async function upsertUser(
  db: D1Database,
  data: { id: string; email: string; name: string; picture: string }
): Promise<User> {
  const existing = await findUser(db, data.id);
  if (existing) {
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare(
        `UPDATE users SET name = ?, picture = ?, updated_at = ? WHERE id = ?`
      )
      .bind(data.name, data.picture, now, data.id)
      .run();
    return (await findUser(db, data.id))!;
  }
  return createUser(db, data);
}

// 检查用户是否有可用点数（Pro 用户无限制）
export function hasCredits(user: User): boolean {
  if (user.plan === "pro") {
    // Pro 未过期
    if (!user.plan_expires_at) return true;
    return Math.floor(Date.now() / 1000) < user.plan_expires_at;
  }
  return user.credits > 0;
}

// 扣减点数（生成时调用），返回是否成功
export async function consumeCredit(db: D1Database, userId: string): Promise<boolean> {
  const user = await findUser(db, userId);
  if (!user) return false;

  // Pro 用户不扣点数，只增加总生成数
  if (user.plan === "pro" && (!user.plan_expires_at || Math.floor(Date.now() / 1000) < user.plan_expires_at)) {
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare(`UPDATE users SET total_generations = total_generations + 1, updated_at = ? WHERE id = ?`)
      .bind(now, userId)
      .run();
    await addCreditLog(db, userId, 0, "generation", null);
    return true;
  }

  // 免费用户检查点数
  if (user.credits <= 0) return false;

  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `UPDATE users SET credits = credits - 1, total_generations = total_generations + 1, updated_at = ? WHERE id = ?`
    )
    .bind(now, userId)
    .run();
  await addCreditLog(db, userId, -1, "generation", null);
  return true;
}

// 增加点数（购买/邀请奖励）
export async function addCredits(
  db: D1Database,
  userId: string,
  amount: number,
  reason: CreditReason,
  refId: string | null = null
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`UPDATE users SET credits = credits + ?, updated_at = ? WHERE id = ?`)
    .bind(amount, now, userId)
    .run();
  await addCreditLog(db, userId, amount, reason, refId);
}

// 记录流水
async function addCreditLog(
  db: D1Database,
  userId: string,
  delta: number,
  reason: CreditReason,
  refId: string | null
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO credit_logs (user_id, delta, reason, ref_id, created_at) VALUES (?, ?, ?, ?, ?)`
    )
    .bind(userId, delta, reason, refId, now)
    .run();
}

// 处理邀请关系（新用户注册时，如果携带 ref 参数）
export async function handleReferral(
  db: D1Database,
  referrerId: string,
  refereeId: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  // 检查是否已有邀请关系
  const existing = await db
    .prepare(`SELECT id FROM referrals WHERE referee_id = ?`)
    .bind(refereeId)
    .first();
  if (existing) return;

  await db
    .prepare(`INSERT INTO referrals (referrer_id, referee_id, rewarded, created_at) VALUES (?, ?, 0, ?)`)
    .bind(referrerId, refereeId, now)
    .run();

  // 双方各奖励2次
  await addCredits(db, referrerId, 2, "referral", refereeId);
  await addCredits(db, refereeId, 2, "referral", referrerId);

  // 标记已发放
  await db
    .prepare(`UPDATE referrals SET rewarded = 1 WHERE referee_id = ?`)
    .bind(refereeId)
    .run();
}
