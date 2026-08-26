export type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

export type ContributionYear = {
  year: number;
  total: number;
  days: ContributionDay[];
};

export type GithubUserCard = {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  htmlUrl: string;
  createdAt: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  location: string | null;
  company: string | null;
  blog: string | null;
};

export type PublicRepo = {
  name: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  updatedAt: string;
};

export type TechStackItem = {
  name: string;
  repos: number;
  kind: "language" | "topic";
};

export type VoyageWeek = {
  start: string;
  total: number;
  peak: number;
  days: ContributionDay[];
};

export type ContributionWrap = {
  user: GithubUserCard;
  years: ContributionYear[];
  lastYearTotal: number;
  allTimeTotal: number;
  topRepos: PublicRepo[];
  stack: TechStackItem[];
  busiestMonth: { label: string; total: number } | null;
  quietestMonth: { label: string; total: number } | null;
  activeDays: number;
};

export const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export function normalizeUsername(value: string) {
  return value.trim().replace(/^@/, "");
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

const GITHUB_HEADERS = {
  "User-Agent": "github-contribution-wrap",
  Accept: "text/html,application/json",
};

function parseCountFromTip(tip: string) {
  const cleaned = tip.replace(/\s+/g, " ").trim();
  if (/^no contributions/i.test(cleaned)) return 0;
  const match = cleaned.match(/^([\d,]+)\s+contribution/i);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

function parseHeadingTotal(html: string) {
  const heading = html.match(
    /id="js-contribution-activity-description"[^>]*>([\s\S]*?)<\/h2>/i,
  );
  if (!heading) return 0;
  const number = heading[1].replace(/,/g, "").match(/(\d+)/);
  return number ? Number(number[1]) : 0;
}

export function parseContributionCalendar(html: string): ContributionDay[] {
  const days: ContributionDay[] = [];
  const pattern =
    /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d+)"[\s\S]{0,500}?<tool-tip[^>]*>([\s\S]*?)<\/tool-tip>/g;
  for (const match of html.matchAll(pattern)) {
    days.push({
      date: match[1],
      level: Number(match[2]),
      count: parseCountFromTip(match[3]),
    });
  }
  if (days.length) return days;

  const fallback = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d+)"/g;
  for (const match of html.matchAll(fallback)) {
    days.push({ date: match[1], level: Number(match[2]), count: 0 });
  }
  return days;
}

async function fetchGithubHtml(url: string) {
  const response = await fetch(url, {
    headers: GITHUB_HEADERS,
    next: { revalidate: 600 },
  });
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status})`);
  }
  return response.text();
}

export async function fetchGithubUser(username: string): Promise<GithubUserCard | null> {
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      "User-Agent": GITHUB_HEADERS["User-Agent"],
      Accept: "application/vnd.github+json",
    },
    next: { revalidate: 600 },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    return {
      login: username,
      name: null,
      avatarUrl: `https://github.com/${username}.png?size=160`,
      bio: null,
      htmlUrl: `https://github.com/${username}`,
      createdAt: null,
      followers: 0,
      following: 0,
      publicRepos: 0,
      location: null,
      company: null,
      blog: null,
    };
  }

  const data = (await response.json()) as {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    html_url: string;
    created_at: string;
    followers: number;
    following: number;
    public_repos: number;
    location: string | null;
    company: string | null;
    blog: string | null;
    message?: string;
  };

  if (data.message === "Not Found") return null;

  return {
    login: data.login,
    name: data.name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    htmlUrl: data.html_url,
    createdAt: data.created_at,
    followers: data.followers,
    following: data.following,
    publicRepos: data.public_repos,
    location: data.location,
    company: data.company,
    blog: data.blog,
  };
}

type GithubRepoPayload = {
  name: string;
  fork: boolean;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  updated_at: string;
};

export async function fetchProfileExtras(username: string) {
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated&type=owner`,
    {
      headers: {
        "User-Agent": GITHUB_HEADERS["User-Agent"],
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 600 },
    },
  );
  if (!response.ok) return { topRepos: [] as PublicRepo[], stack: [] as TechStackItem[] };

  const payload = (await response.json()) as GithubRepoPayload[] | { message?: string };
  if (!Array.isArray(payload)) return { topRepos: [] as PublicRepo[], stack: [] as TechStackItem[] };

  const owned = payload.filter((repo) => !repo.fork);
  const topRepos = [...owned]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8)
    .map((repo) => ({
      name: repo.name,
      description: repo.description,
      htmlUrl: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      topics: repo.topics ?? [],
      updatedAt: repo.updated_at,
    }));

  const languages = new Map<string, number>();
  const topics = new Map<string, number>();
  for (const repo of owned) {
    if (repo.language) languages.set(repo.language, (languages.get(repo.language) ?? 0) + 1);
    for (const topic of repo.topics ?? []) {
      topics.set(topic, (topics.get(topic) ?? 0) + 1);
    }
  }

  const stack: TechStackItem[] = [
    ...[...languages.entries()].map(([name, repos]) => ({ name, repos, kind: "language" as const })),
    ...[...topics.entries()].map(([name, repos]) => ({ name, repos, kind: "topic" as const })),
  ]
    .sort((a, b) => b.repos - a.repos)
    .slice(0, 12);

  return { topRepos, stack };
}

export function monthTotals(days: ContributionDay[]) {
  const buckets = new Map<string, number>();
  for (const day of days) {
    const label = day.date.slice(0, 7);
    buckets.set(label, (buckets.get(label) ?? 0) + day.count);
  }
  const ranked = [...buckets.entries()]
    .map(([key, total]) => ({
      key,
      total,
      label: new Date(`${key}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
    }))
    .sort((a, b) => b.total - a.total);
  return {
    busiestMonth: ranked[0] ? { label: ranked[0].label, total: ranked[0].total } : null,
    quietestMonth: ranked.length ? { label: ranked[ranked.length - 1].label, total: ranked[ranked.length - 1].total } : null,
  };
}

export function weeksAsVoyages(days: ContributionDay[]): VoyageWeek[] {
  return weeksFromDays(days)
    .map((week) => {
      const filled = week.filter((day): day is ContributionDay => Boolean(day));
      if (!filled.length) return null;
      const total = filled.reduce((sum, day) => sum + day.count, 0);
      return {
        start: filled[0].date,
        total,
        peak: Math.max(...filled.map((day) => day.count)),
        days: filled,
      };
    })
    .filter((week): week is VoyageWeek => Boolean(week));
}

async function fetchYearFromGithub(username: string, year: number): Promise<ContributionYear> {
  const html = await fetchGithubHtml(
    `https://github.com/users/${username}/contributions?from=${year}-01-01&to=${year}-12-31`,
  );
  const days = parseContributionCalendar(html).filter((day) => day.date.startsWith(String(year)));
  const headingTotal = parseHeadingTotal(html);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  return { year, days, total: headingTotal || total };
}

async function fetchLastYearFromGithub(username: string) {
  const html = await fetchGithubHtml(`https://github.com/users/${username}/contributions`);
  return {
    days: parseContributionCalendar(html),
    total: parseHeadingTotal(html),
    html,
  };
}

type JogruberPayload = {
  total?: Record<string, number>;
  contributions?: { date: string; count: number; level: number }[];
};

async function fetchFromJogruber(username: string): Promise<ContributionYear[]> {
  const response = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${username}?y=all`,
    { headers: GITHUB_HEADERS, next: { revalidate: 600 } },
  );
  if (!response.ok) throw new Error("Contribution fallback failed");
  const payload = (await response.json()) as JogruberPayload;
  const byYear = new Map<number, ContributionDay[]>();
  for (const day of payload.contributions ?? []) {
    const year = Number(day.date.slice(0, 4));
    const list = byYear.get(year) ?? [];
    list.push({ date: day.date, count: day.count, level: day.level });
    byYear.set(year, list);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, days]) => ({
      year,
      days,
      total: payload.total?.[String(year)] ?? days.reduce((sum, day) => sum + day.count, 0),
    }));
}

export async function loadContributionWrap(rawUsername: string): Promise<ContributionWrap> {
  const username = normalizeUsername(rawUsername);
  if (!isValidUsername(username)) {
    throw Object.assign(new Error("Enter a valid GitHub username."), { status: 400 });
  }

  const user = await fetchGithubUser(username);
  if (user === null) {
    throw Object.assign(new Error("GitHub user not found."), { status: 404 });
  }

  let years: ContributionYear[] = [];
  try {
    const createdYear = user.createdAt ? new Date(user.createdAt).getUTCFullYear() : null;
    const currentYear = new Date().getUTCFullYear();
    if (createdYear && createdYear <= currentYear) {
      const range = Array.from({ length: currentYear - createdYear + 1 }, (_, index) => currentYear - index);
      const collected: ContributionYear[] = [];
      for (let index = 0; index < range.length; index += 5) {
        const batch = await Promise.all(range.slice(index, index + 5).map((year) => fetchYearFromGithub(user.login, year)));
        collected.push(...batch);
      }
      years = collected.filter((year) => year.days.length > 0);
    } else {
      const last = await fetchYearFromGithub(user.login, currentYear);
      years = [last];
    }
  } catch {
    years = await fetchFromJogruber(user.login);
  }

  if (!years.length) {
    years = await fetchFromJogruber(user.login);
  }

  const lastYear = await fetchLastYearFromGithub(user.login).catch(() => null);
  const extras = await fetchProfileExtras(user.login).catch(() => ({ topRepos: [], stack: [] }));
  const allDays = years.flatMap((year) => year.days);
  const months = monthTotals(allDays);
  const allTimeTotal = years.reduce((sum, year) => sum + year.total, 0);

  return {
    user,
    years,
    lastYearTotal: lastYear?.total ?? years[0]?.total ?? 0,
    allTimeTotal,
    topRepos: extras.topRepos,
    stack: extras.stack,
    busiestMonth: months.busiestMonth,
    quietestMonth: months.quietestMonth,
    activeDays: allDays.filter((day) => day.count > 0).length,
  };
}

export function computeStreaks(days: ContributionDay[]) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let run = 0;

  for (const day of sorted) {
    if (day.count > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    if (sorted[index].count > 0) current += 1;
    else if (index === sorted.length - 1) continue;
    else break;
  }

  const busiest = sorted.reduce<ContributionDay | null>((best, day) => {
    if (!best || day.count > best.count) return day;
    return best;
  }, null);

  return { longest, current, busiest };
}

export function weeksFromDays(days: ContributionDay[]) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return [] as (ContributionDay | null)[][];

  const first = new Date(`${sorted[0].date}T00:00:00Z`);
  const offset = first.getUTCDay();
  const padded: (ContributionDay | null)[] = Array.from({ length: offset }, () => null);
  padded.push(...sorted);

  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: (ContributionDay | null)[][] = [];
  for (let index = 0; index < padded.length; index += 7) {
    weeks.push(padded.slice(index, index + 7));
  }
  return weeks;
}

export function monthLabels(weeks: (ContributionDay | null)[][]) {
  const labels: { week: number; label: string }[] = [];
  let last = "";
  weeks.forEach((week, weekIndex) => {
    const firstDay = week.find((day) => day)?.date;
    if (!firstDay) return;
    const label = new Date(`${firstDay}T00:00:00Z`).toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    if (label !== last) {
      labels.push({ week: weekIndex, label });
      last = label;
    }
  });
  return labels;
}
