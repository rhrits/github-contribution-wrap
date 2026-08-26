import type { ContributionWrap } from "@/lib/github-contributions";
import { computeStreaks } from "@/lib/github-contributions";

export type Award = {
  id: string;
  name: string;
  blurb: string;
  tone: "gold" | "silver" | "green" | "blue" | "ember";
  earned: boolean;
};

export function wrapTokens(wrap: ContributionWrap) {
  return Math.floor(wrap.allTimeTotal / 50);
}

export function computeAwards(wrap: ContributionWrap): Award[] {
  const stats = computeStreaks(wrap.years.flatMap((year) => year.days));
  const languages = wrap.stack.filter((item) => item.kind === "language").length;
  const stars = wrap.topRepos.reduce((sum, repo) => sum + repo.stars, 0);
  const peakYear = wrap.years.reduce((best, year) => (year.total > best.total ? year : best), wrap.years[0]);

  return [
    {
      id: "first-light",
      name: "First Light",
      blurb: "Logged at least one public contribution.",
      tone: "green",
      earned: wrap.allTimeTotal > 0,
    },
    {
      id: "forest-keeper",
      name: "Forest Keeper",
      blurb: "1,000 or more all-time contributions.",
      tone: "green",
      earned: wrap.allTimeTotal >= 1000,
    },
    {
      id: "streak-titan",
      name: "Streak Titan",
      blurb: "Held a 14-day or longer streak.",
      tone: "gold",
      earned: stats.longest >= 14,
    },
    {
      id: "iron-year",
      name: "Iron Year",
      blurb: "A single year carried 365+ contributions.",
      tone: "silver",
      earned: Boolean(peakYear && peakYear.total >= 365),
    },
    {
      id: "high-tide",
      name: "High Tide",
      blurb: "Last twelve months topped 500 contributions.",
      tone: "blue",
      earned: wrap.lastYearTotal >= 500,
    },
    {
      id: "polyglot",
      name: "Polyglot",
      blurb: "Four or more languages in public repos.",
      tone: "blue",
      earned: languages >= 4,
    },
    {
      id: "star-harbor",
      name: "Star Harbor",
      blurb: "Public repos hold 10 or more stars together.",
      tone: "gold",
      earned: stars >= 10,
    },
    {
      id: "ember-forge",
      name: "Ember Forge",
      blurb: "A month burned hotter than 200 commits.",
      tone: "ember",
      earned: (wrap.busiestMonth?.total ?? 0) >= 200,
    },
    {
      id: "voyage-master",
      name: "Voyage Master",
      blurb: "Charts span five or more years.",
      tone: "silver",
      earned: wrap.years.length >= 5,
    },
    {
      id: "daylight",
      name: "Daylight",
      blurb: "200+ active days on the calendar.",
      tone: "green",
      earned: wrap.activeDays >= 200,
    },
  ];
}
