import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifyJWT } from "@/lib/jwt";
import { findUser } from "@/lib/db";

export const runtime = "edge";

export async function GET(req: Request) {
  const { env } = getRequestContext();
  const e = env as any;
  const jwtSecret = e.JWT_SECRET;

  if (!jwtSecret) {
    return Response.json({ user: null });
  }

  // 从 cookie 取 JWT
  const cookie = req.headers.get("cookie") || "";
  const token = cookie
    .split(";")
    .find((c) => c.trim().startsWith("auth="))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!token) return Response.json({ user: null });

  const payload = await verifyJWT(token, jwtSecret);
  if (!payload) return Response.json({ user: null });

  // 从 D1 拉取最新用户数据（确保 credits/plan 是实时的）
  const db: D1Database = e.DB;
  const user = await findUser(db, payload.sub as string);

  if (!user) return Response.json({ user: null });

  // 判断 Pro 是否有效
  const isPro =
    user.plan === "pro" &&
    (!user.plan_expires_at ||
      Math.floor(Date.now() / 1000) < user.plan_expires_at);

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      plan: isPro ? "pro" : "free",
      credits: user.credits,
      totalGenerations: user.total_generations,
    },
  });
}
