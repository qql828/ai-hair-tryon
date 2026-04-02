import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifyJWT } from "@/lib/jwt";
import { findUser, hasCredits, consumeCredit } from "@/lib/db";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { env } = getRequestContext();
    const e = env as any;

    // ── 鉴权：必须登录 ──────────────────────────────────────────
    const cookie = req.headers.get("cookie") || "";
    const token = cookie
      .split(";")
      .find((c) => c.trim().startsWith("auth="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (!token || !e.JWT_SECRET) {
      return NextResponse.json(
        { error: "请先登录后再使用", code: "NOT_LOGGED_IN" },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token, e.JWT_SECRET);
    if (!payload) {
      return NextResponse.json(
        { error: "登录已过期，请重新登录", code: "TOKEN_EXPIRED" },
        { status: 401 }
      );
    }

    // ── 点数检查 ────────────────────────────────────────────────
    const db: D1Database = e.DB;
    const user = await findUser(db, payload.sub as string);

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在，请重新登录", code: "USER_NOT_FOUND" },
        { status: 401 }
      );
    }

    if (!hasCredits(user)) {
      return NextResponse.json(
        {
          error: "点数不足，请购买点数包或升级 Pro",
          code: "NO_CREDITS",
          credits: user.credits,
          plan: user.plan,
        },
        { status: 402 }
      );
    }

    // ── 解析请求 ────────────────────────────────────────────────
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const mask = formData.get("mask") as File | null;
    const prompt = formData.get("prompt") as string | null;
    const negativePrompt = formData.get("negativePrompt") as string | null;

    if (!image || !mask || !prompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = e.STABILITY_API_KEY || process.env.STABILITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // ── 调用 Stability AI ───────────────────────────────────────
    const stabilityForm = new FormData();
    stabilityForm.append("image", image);
    stabilityForm.append("mask", mask);
    stabilityForm.append("prompt", prompt);
    if (negativePrompt) {
      stabilityForm.append("negative_prompt", negativePrompt);
    }
    stabilityForm.append("output_format", "png");

    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/edit/inpaint",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "image/*",
        },
        body: stabilityForm,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Stability AI error:", errText);

      if (response.status === 402) {
        return NextResponse.json({ error: "API 余额不足，请联系管理员" }, { status: 402 });
      }
      if (response.status === 403) {
        return NextResponse.json({ error: "内容被过滤，请尝试其他照片" }, { status: 403 });
      }
      return NextResponse.json({ error: "生成失败，请稍后重试" }, { status: 500 });
    }

    // ── 生成成功，扣减点数 ──────────────────────────────────────
    await consumeCredit(db, user.id);

    // ── 返回结果 ────────────────────────────────────────────────
    const imageBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);

    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);

    // 返回剩余点数，前端可以实时更新显示
    const updatedUser = await findUser(db, user.id);
    const remainingCredits = updatedUser?.plan === "pro" ? -1 : (updatedUser?.credits ?? 0);

    return NextResponse.json({
      image: `data:image/png;base64,${base64}`,
      needsComposite: true,
      credits: remainingCredits, // -1 表示 Pro 无限
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
