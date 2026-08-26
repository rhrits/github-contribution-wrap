import type { ContributionWrap } from "@/lib/github-contributions";
import { computeStreaks } from "@/lib/github-contributions";

export function wrapShareUrl(login: string) {
  if (typeof window === "undefined") return `https://github.com/${login}`;
  const url = new URL(window.location.href);
  url.searchParams.set("u", login);
  return url.toString();
}

export function generateThought(wrap: ContributionWrap) {
  const stats = computeStreaks(wrap.years.flatMap((year) => year.days));
  const flagship = wrap.topRepos[0];
  const cargo = wrap.stack.filter((item) => item.kind === "language").slice(0, 3).map((item) => item.name);
  const month = wrap.busiestMonth?.label ?? "this voyage";
  const name = wrap.user.name || wrap.user.login;

  const lines = [
    `${name} sailed ${wrap.allTimeTotal.toLocaleString()} commits across ${wrap.years.length} years.`,
    wrap.lastYearTotal
      ? `Last twelve months carried ${wrap.lastYearTotal.toLocaleString()} contributions, with a ${stats.longest}-day longest streak.`
      : `The harbor is quiet lately, but the charts still glow.`,
    wrap.busiestMonth
      ? `${month} was high tide (${wrap.busiestMonth.total.toLocaleString()} commits).`
      : "",
    cargo.length ? `Cargo in the hold: ${cargo.join(", ")}.` : "",
    flagship ? `Flagship repo: ${flagship.name}${flagship.stars ? ` · ${flagship.stars}★` : ""}.` : "",
    `Charted with WRAP. by Hritik Raj (@rhrits).`,
  ].filter(Boolean);

  return lines.join(" ");
}

export function twitterIntent(text: string, url: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function linkedInIntent(url: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}
