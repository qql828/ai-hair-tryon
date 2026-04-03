import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifyJWT } from "@/lib/jwt";
import { findUser } from "@/lib/db";
import { getPayPalAccessToken, createPayPalOrder } from "@/lib/paypal";

export const runtime = "edge";

// 点数包配置
const CREDIT_PACKS: Record<
  string,
  { credits: number; amount: string; description: string }
> = {
  credits_10: {
    credits: 10,
    amount: "1.90",
    description: "AI Hair Try-On - 10 Credits",
  },
  credits_50: {
    credits: 50,
    amount: "6.90",
    description: "AI Hair Try-On - 50 Credits",
  },
  credits_200: {
    credits: 200,
    amount: "19.90",
    description: "AI Hair Try-On - 200 Credits",
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

    // 解析请求体
    const body = await req.json() as { productType: string };
    const { productType } = body;
    const pack = CREDIT_PACKS[productType];
    if (!pack) {
      return Response.json({ error: "Invalid product type" }, { status: 400 });
    }

    // 获取 PayPal access token
    const accessToken = await getPayPalAccessToken(
      e.PAYPAL_CLIENT_ID,
      e.PAYPAL_CLIENT_SECRET
    );

    // 构造回调 URL
    const origin = new URL(req.url).origin;
    const returnUrl = `${origin}/api/paypal/capture-order?productType=${productType}&userId=${user.id}`;
    const cancelUrl = `${origin}/pricing?cancelled=1`;

    // 创建 PayPal 订单
    const order = await createPayPalOrder(
      accessToken,
      pack.amount,
      pack.description,
      returnUrl,
      cancelUrl
    );

    // 记录待支付订单到 DB
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare(
        `INSERT OR REPLACE INTO orders (id, user_id, product_type, amount, credits, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
      )
      .bind(order.id, user.id, productType, pack.amount, pack.credits, now, now)
      .run();

    return Response.json({ orderId: order.id, approveUrl: order.approveUrl });
  } catch (err: any) {
    console.error("create-order error:", err);
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
