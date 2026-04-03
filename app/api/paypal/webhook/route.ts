import { getRequestContext } from "@cloudflare/next-on-pages";
import { getPayPalAccessToken, verifyPayPalWebhook } from "@/lib/paypal";

export const runtime = "edge";

const PLAN_EXPIRES: Record<string, number> = {
  pro_monthly: 31 * 24 * 3600,
  pro_yearly: 366 * 24 * 3600,
};

export async function POST(req: Request) {
  try {
    const { env } = getRequestContext();
    const e = env as any;
    const db: D1Database = e.DB;

    const body = await req.text();

    // 验证 Webhook 签名（需要在 PayPal Dashboard 配置 Webhook ID 到环境变量）
    const webhookId = e.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      const accessToken = await getPayPalAccessToken(
        e.PAYPAL_CLIENT_ID,
        e.PAYPAL_CLIENT_SECRET
      );
      const headers: Record<string, string> = {};
      req.headers.forEach((v, k) => { headers[k] = v; });
      const valid = await verifyPayPalWebhook(accessToken, webhookId, headers, body);
      if (!valid) {
        console.error("PayPal webhook signature invalid");
        return new Response("Invalid signature", { status: 400 });
      }
    }

    const event = JSON.parse(body) as {
      event_type: string;
      resource: any;
    };

    const now = Math.floor(Date.now() / 1000);

    switch (event.event_type) {
      // 订阅激活/续费
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RENEWED": {
        const subscriptionId: string = event.resource.id;
        const customId: string = event.resource.custom_id; // userId

        const sub = await db
          .prepare(`SELECT * FROM subscriptions WHERE id = ?`)
          .bind(subscriptionId)
          .first<{ plan_type: string; user_id: string }>();

        const planType = sub?.plan_type ?? "pro_monthly";
        const userId = sub?.user_id ?? customId;
        const expiresIn = PLAN_EXPIRES[planType] ?? 31 * 24 * 3600;
        const periodEnd = now + expiresIn;

        await db
          .prepare(
            `UPDATE subscriptions SET status = 'active', current_period_end = ?, updated_at = ? WHERE id = ?`
          )
          .bind(periodEnd, now, subscriptionId)
          .run();

        await db
          .prepare(
            `UPDATE users SET plan = 'pro', plan_expires_at = ?, updated_at = ? WHERE id = ?`
          )
          .bind(periodEnd, now, userId)
          .run();
        break;
      }

      // 订阅取消
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const subscriptionId: string = event.resource.id;

        await db
          .prepare(`UPDATE subscriptions SET status = 'cancelled', updated_at = ? WHERE id = ?`)
          .bind(now, subscriptionId)
          .run();

        // 找到对应用户，降级为 free
        const sub = await db
          .prepare(`SELECT user_id FROM subscriptions WHERE id = ?`)
          .bind(subscriptionId)
          .first<{ user_id: string }>();

        if (sub?.user_id) {
          await db
            .prepare(`UPDATE users SET plan = 'free', plan_expires_at = NULL, updated_at = ? WHERE id = ?`)
            .bind(now, sub.user_id)
            .run();
        }
        break;
      }

      // 付款失败
      case "PAYMENT.SALE.DENIED":
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
        // 记录日志，可选：发邮件通知用户
        console.warn("PayPal payment failed:", event.resource?.id);
        break;
      }

      default:
        // 忽略其他事件
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (err: any) {
    console.error("webhook error:", err);
    return new Response("Error", { status: 500 });
  }
}
