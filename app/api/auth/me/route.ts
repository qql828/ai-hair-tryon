import { verifyJWT } from "@/lib/jwt";

export const runtime = "edge";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.split(";").find((c) => c.trim().startsWith("auth="))?.split("=").slice(1).join("=");

  if (!token) return Response.json({ user: null });

  const payload = await verifyJWT(token, process.env.JWT_SECRET!);
  if (!payload) return Response.json({ user: null });

  return Response.json({ user: { email: payload.email, name: payload.name, picture: payload.picture } });
}
