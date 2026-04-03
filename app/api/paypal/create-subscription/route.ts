import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifyJWT } from "@/lib/jwt";
import { findUser } from "@/lib/db";
import {
  getPayPalAccessToken,
  createPayPalProduct,
  createPayPalPlan,
  createPayPalSubscription,
} from "@/lib/paypal";

export const runtime = "edge";

// 订阅套餐配置
const SUBSCRIPTION_PLANS: Record<
  string,
  {
    name: string;
    amount: string;
    intervalUnit: "MONTH" | "YEAR";
    intervalCount: number;
    expiresInSeconds: number; // 订阅周期长度(秒)，用于设置 plan_expires_at
  }
> = {
  pro_monthly: {
    name: "AI Hair Try-On Pro Monthly",
    amount: "4.90",
    intervalUnit: "MONTH",
    intervalCount: 1,
    expiresInSeconds: 31 * 24 * 3600,
  },
  pro_yearly: {
    name: "AI Hair Try-On Pro Yearly",
    amount: "39.00",
    intervalUnit: "YEAR",
    intervalCount: 1,
    expiresInSeconds: 366 * 24 * 3600,
  },
};

export async function POST(req: Request) {
  try {
    const { env } = getRequestContext();
    const e = env as any;

    // 验证登录
    const cookie = req.headers.get("cookie") || "";
    const token = cookie
      .split(";")
      .find((c) => c.trim().startsWith("auth="))
      ?.split("=")
      .slice(1)
      .join("=");
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyJWT(token, e.JWT_SECRET);
    if (!payload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db: D1Database = e.DB;
    const user = await findUser(db, payload.sub as string);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json() as { planType: string };
    const { planType } = body;
    const planConfig = SUBSCRIPTION_PLANS[planType];
    if (!planConfig) {
      return Response.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // 获取 PayPal access token
    const accessToken = await getPayPalAccessToken(
      e.PAYPAL_CLIENT_ID,
      e.PAYPAL_CLIENT_SECRET
    );

    // 检查 env 中是否已存储 PayPal plan ID（避免重复创建）
    // 使用 KV 或 D1 缓存 plan_id。这里用 D1 简单存一个配置表
    let planId = planType === "pro_monthly"
      ? e.PAYPAL_PLAN_ID_MONTHLY
      : e.PAYPAL_PLAN_ID_YEARLY;

    // 如果环境变量没配置 plan_id，动态创建（仅首次，之后固化到 env）
    if (!planId) {
      // 先创建 product
      const productId = await createPayPalProduct(
        accessToken,
        "AI Hair Try-On Pro",
        "AI-powered virtual hairstyle try-on service"
      );
      // 再创建 plan
      planId = await createPayPalPlan(
        accessToken,
        productId,
        planConfig.name,
        planConfig.amount,
        planConfig.intervalUnit,
        planConfig.intervalCount
      );
      // 注意：生产中应将 planId 固化到 Cloudflare 环境变量
      // 这里返回 planId 提示开发者配置
      console.log(`Created PayPal plan: ${planId} for ${planType}`);
    }

    const origin = new URL(req.url).origin;
    const returnUrl = `${origin}/api/paypal/subscription-callback?planType=${planType}&userId=${user.id}`;
    const cancelUrl = `${origin}/pricing?cancelled=1`;

    const subscription = await createPayPalSubscription(
      accessToken,
      planId,
      returnUrl,
      cancelUrl,
      user.id
    );

    // 记录待激活订阅
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare(
        `INSERT OR REPLACE INTO subscriptions (id, user_id, plan_type, plan_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?)`
      )
      .bind(subscription.id, user.id, planType, planId, now, now)
      .run();

    return Response.json({
      subscriptionId: subscription.id,
      approveUrl: subscription.approveUrl,
    });
  } catch (err: any) {
    console.error("create-subscription error:", err);
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
