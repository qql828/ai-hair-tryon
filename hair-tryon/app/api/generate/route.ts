import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const mask = formData.get("mask") as File | null;
    const prompt = formData.get("prompt") as string | null;
    const negativePrompt = formData.get("negativePrompt") as string | null;

    if (!image || !mask || !prompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

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

    const imageBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);

    // Convert to base64 in chunks to avoid stack overflow
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);

    // Return generated image + flag to trigger client-side compositing
    return NextResponse.json({
      image: `data:image/png;base64,${base64}`,
      needsComposite: true,
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
