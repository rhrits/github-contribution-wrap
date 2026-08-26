import { NextResponse } from "next/server";
import { loadContributionWrap, normalizeUsername } from "@/lib/github-contributions";

export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = normalizeUsername(searchParams.get("username") ?? "");

  if (!username) {
    return NextResponse.json({ error: "Add a GitHub username." }, { status: 400 });
  }

  try {
    const wrap = await loadContributionWrap(username);
    return NextResponse.json(wrap, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error
      ? Number((error as { status: number }).status)
      : 500;
    const message = error instanceof Error ? error.message : "Could not load contributions.";
    return NextResponse.json({ error: message }, { status: Number.isFinite(status) ? status : 500 });
  }
}
