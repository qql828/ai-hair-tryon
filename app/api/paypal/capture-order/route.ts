import { getRequestContext } from "@cloudflare/next-on-pages";
import { addCredits } from "@/lib/db";
import { getPayPalAccessToken, capturePayPalOrder } from "@/lib/paypal";

export const runtime = "edge";

const CREDIT_AMOUNTS: Record<string, number> = {
  credits_10: 10,
  credits_50: 50,
  credits_200: 200,
};

export async function GET(req: Request) {
  try {
    const { env } = getRequestContext();
    const e = env as any;
    const db: D1Database = e.DB;

    const url = new URL(req.url);
    const orderId = url.searchParams.get("token"); // PayPal 回调时用 token 参数传 orderId
    const productType = url.searchParams.get("productType") || "";
    const userId = url.searchParams.get("userId") || "";

    if (!orderId || !userId || !productType) {
      return Response.redirect(`${url.origin}/pricing?error=missing_params`);
    }

    // 查询订单是否存在且为 pending
    const order = await db
      .prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 'pending'`)
      .bind(orderId, userId)
      .first<{ id: string; credits: number; status: string }>();

    if (!order) {
      // 可能已经处理过（幂等）
      return Response.redirect(`${url.origin}/pricing?success=1&already=1`);
    }

    // 捕获 PayPal 订单
    const accessToken = await getPayPalAccessToken(
      e.PAYPAL_CLIENT_ID,
      e.PAYPAL_CLIENT_SECRET
    );
    const captured = await capturePayPalOrder(accessToken, orderId);

    if (captured.status !== "COMPLETED") {
      return Response.redirect(`${url.origin}/pricing?error=payment_failed`);
    }

    // 更新订单状态
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare(`UPDATE orders SET status = 'completed', updated_at = ? WHERE id = ?`)
      .bind(now, orderId)
      .run();

    // 给用户加点数
    const credits = CREDIT_AMOUNTS[productType] ?? order.credits;
    await addCredits(db, userId, credits, "purchase", orderId);

    // 跳回定价页，带成功参数
    return Response.redirect(`${url.origin}/pricing?success=1&credits=${credits}`);
  } catch (err: any) {
    console.error("capture-order error:", err);
    const origin = new URL(req.url).origin;
    return Response.redirect(`${origin}/pricing?error=server_error`);
  }
}
