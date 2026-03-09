import { NextResponse } from "next/server";
import { resolveGoogleNewsUrl } from "@/lib/google-news-resolver";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const sourceUrl = String(payload?.url ?? "").trim();

  if (!sourceUrl) {
    return NextResponse.json({ error: "Article URL is required." }, { status: 400 });
  }

  try {
    const resolvedUrl = await resolveGoogleNewsUrl(sourceUrl);

    return NextResponse.json({
      data: {
        sourceUrl,
        resolvedUrl: resolvedUrl || null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resolve article URL.";

    return NextResponse.json(
      {
        error: message,
        data: {
          sourceUrl,
          resolvedUrl: null,
        },
      },
      { status: 500 },
    );
  }
}