import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifyJWT } from "@/lib/jwt";

export const runtime = "edge";

export async function GET(req: Request) {
  const { env } = getRequestContext();
  const jwtSecret = (env as Record<string, string>).JWT_SECRET;

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

  return Response.json({
    user: { email: payload.email, name: payload.name, picture: payload.picture },
  });
}
