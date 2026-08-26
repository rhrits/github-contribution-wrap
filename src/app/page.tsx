import { WrapClient } from "./wrap-client";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const params = await searchParams;
  return <WrapClient initialUsername={params.u ?? ""} />;
}
