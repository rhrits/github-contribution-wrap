import type { Metadata } from "next";
import { WrapClient } from "./wrap-client";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}): Promise<Metadata> {
  const { u } = await searchParams;
  if (!u) {
    return { title: SITE_TITLE, description: SITE_DESCRIPTION };
  }
  const username = u.replace(/^@/, "");
  const title = `@${username} GitHub wrap`;
  const description = `Contribution wrap, heatmap, awards, and tech stack for GitHub user @${username}. Generated with WRAP. by Hritik Raj in India.`;
  return {
    title,
    description,
    alternates: { canonical: `/?u=${encodeURIComponent(username)}` },
    openGraph: {
      title: `@${username} · WRAP.`,
      description,
      images: ["/og.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `@${username} · WRAP.`,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const params = await searchParams;
  return <WrapClient initialUsername={params.u ?? ""} />;
}
