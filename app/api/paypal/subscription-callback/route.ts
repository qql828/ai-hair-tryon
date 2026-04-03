import { getRequestContext } from "@cloudflare/next-on-pages";
import { getPayPalAccessToken, getPayPalSubscription } from "@/lib/paypal";

export const runtime = "edge";

const PLAN_EXPIRES: Record<string, number> = {
  pro_monthly: 31 * 24 * 3600,
  pro_yearly: 366 * 24 * 3600,
};

export async function GET(req: Request) {
  try {
    const { env } = getRequestContext();
    const e = env as any;
    const db: D1Database = e.DB;

    const url = new URL(req.url);
    const subscriptionId = url.searchParams.get("subscription_id");
    const planType = url.searchParams.get("planType") || "";
    const userId = url.searchParams.get("userId") || "";

    if (!subscriptionId || !userId) {
      return Response.redirect(`${url.origin}/pricing?error=missing_params`);
    }

    // 获取 PayPal access token
    const accessToken = await getPayPalAccessToken(
      e.PAYPAL_CLIENT_ID,
      e.PAYPAL_CLIENT_SECRET
    );

    // 查询订阅状态
    const sub = await getPayPalSubscription(accessToken, subscriptionId);
    if (sub.status !== "ACTIVE") {
      return Response.redirect(`${url.origin}/pricing?error=subscription_not_active`);
    }

    // 更新订阅表
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = PLAN_EXPIRES[planType] ?? 31 * 24 * 3600;
    const periodEnd = now + expiresIn;

    await db
      .prepare(
        `UPDATE subscriptions SET status = 'active', current_period_end = ?, updated_at = ? WHERE id = ?`
      )
      .bind(periodEnd, now, subscriptionId)
      .run();

    // 更新用户为 Pro
    await db
      .prepare(
        `UPDATE users SET plan = 'pro', plan_expires_at = ?, updated_at = ? WHERE id = ?`
      )
      .bind(periodEnd, now, userId)
      .run();

    return Response.redirect(`${url.origin}/pricing?success=1&plan=pro`);
  } catch (err: any) {
    console.error("subscription-callback error:", err);
    const origin = new URL(req.url).origin;
    return Response.redirect(`${origin}/pricing?error=server_error`);
  }
}
