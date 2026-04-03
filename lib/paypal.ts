export const runtime = "edge";

// 环境切换：sandbox=沙箱测试，live=正式环境
// 测试完成后改为 https://api-m.paypal.com
const PAYPAL_BASE = "https://api-m.sandbox.paypal.com"; // Sandbox 环境

// 获取 PayPal Access Token
export async function getPayPalAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// 创建一次性订单（点数包）
export async function createPayPalOrder(
  accessToken: string,
  amount: string, // e.g. "1.90"
  description: string,
  returnUrl: string,
  cancelUrl: string
): Promise<{ id: string; approveUrl: string }> {
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
          },
          description,
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: "AI Hair Try-On",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order failed: ${err}`);
  }
  const data = await res.json() as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };
  const approveLink = data.links.find((l) => l.rel === "approve");
  return { id: data.id, approveUrl: approveLink?.href ?? "" };
}

// 捕获一次性订单付款
export async function capturePayPalOrder(
  accessToken: string,
  orderId: string
): Promise<{ status: string; id: string }> {
  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed: ${err}`);
  }
  const data = await res.json() as { status: string; id: string };
  return data;
}

// 创建订阅计划
export async function createPayPalPlan(
  accessToken: string,
  productId: string,
  name: string,
  amount: string,
  intervalUnit: "MONTH" | "YEAR",
  intervalCount: number
): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: intervalCount,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 = 无限续费
          pricing_scheme: {
            fixed_price: {
              value: amount,
              currency_code: "USD",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create plan failed: ${err}`);
  }
  const data = await res.json() as { id: string };
  return data.id;
}

// 创建 PayPal Product（订阅前需要先有 product）
export async function createPayPalProduct(
  accessToken: string,
  name: string,
  description: string
): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create product failed: ${err}`);
  }
  const data = await res.json() as { id: string };
  return data.id;
}

// 创建订阅
export async function createPayPalSubscription(
  accessToken: string,
  planId: string,
  returnUrl: string,
  cancelUrl: string,
  customId: string // 用来传 userId
): Promise<{ id: string; approveUrl: string }> {
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: customId,
      application_context: {
        brand_name: "AI Hair Try-On",
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: "SUBSCRIBE_NOW",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create subscription failed: ${err}`);
  }
  const data = await res.json() as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };
  const approveLink = data.links.find((l) => l.rel === "approve");
  return { id: data.id, approveUrl: approveLink?.href ?? "" };
}

// 获取订阅详情
export async function getPayPalSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<{
  id: string;
  status: string;
  custom_id: string;
  plan_id: string;
}> {
  const res = await fetch(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) throw new Error(`PayPal get subscription failed`);
  return res.json() as any;
}

// 验证 PayPal Webhook 签名
export async function verifyPayPalWebhook(
  accessToken: string,
  webhookId: string,
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const res = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
        cert_url: headers["paypal-cert-url"],
        auth_algo: headers["paypal-auth-algo"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
      }),
    }
  );
  if (!res.ok) return false;
  const data = await res.json() as { verification_status: string };
  return data.verification_status === "SUCCESS";
}
