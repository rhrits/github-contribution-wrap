import type { Metadata } from "next";
import { BengaluruClient } from "./bengaluru-client";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}): Promise<Metadata> {
  const { u } = await searchParams;
  const username = u?.replace(/^@/, "");
  const title = username ? `@${username} Bengaluru traffic` : "Bengaluru 3D contribution map";
  const description = username
    ? `GitHub contributions for @${username} drawn as Bengaluru traffic — gig scooties, corporate cabs, and top tech locations.`
    : "Map any GitHub contribution calendar onto a 3D Bengaluru tech-city: Outer Ring Road, Whitefield, Silk Board, and HSR as contribution greens.";
  return {
    title,
    description,
    alternates: { canonical: username ? `/bengaluru?u=${encodeURIComponent(username)}` : "/bengaluru" },
    openGraph: {
      title: `${title} · WRAP.`,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function BengaluruPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const params = await searchParams;
  return <BengaluruClient initialUsername={params.u ?? ""} />;
}
