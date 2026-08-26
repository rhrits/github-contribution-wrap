"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Download, Search } from "lucide-react";
import type { ContributionDay, ContributionWrap } from "@/lib/github-contributions";
import { computeStreaks, isValidUsername, normalizeUsername } from "@/lib/github-contributions";
import { downloadContributionWrap } from "@/lib/export-contribution-wrap";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import styles from "./wrap.module.css";

const EXAMPLES = ["gaearon", "torvalds", "octocat", "vercel"];

export function WrapClient({ initialUsername = "" }: { initialUsername?: string }) {
  const [username, setUsername] = useState(initialUsername);
  const [wrap, setWrap] = useState<ContributionWrap | null>(null);
  const [activeYear, setActiveYear] = useState<number | "all">("all");
  const [selected, setSelected] = useState<ContributionDay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const booted = useRef(false);

  const visibleYears = useMemo(() => {
    if (!wrap) return [];
    if (activeYear === "all") return wrap.years;
    return wrap.years.filter((year) => year.year === activeYear);
  }, [wrap, activeYear]);

  const stats = useMemo(() => {
    if (!wrap) return null;
    const days = wrap.years.flatMap((year) => year.days);
    return computeStreaks(days);
  }, [wrap]);

  useEffect(() => {
    if (booted.current || !initialUsername) return;
    booted.current = true;
    void loadUser(initialUsername);
  }, [initialUsername]);

  async function loadUser(nextUsername: string) {
    const clean = normalizeUsername(nextUsername);
    if (!isValidUsername(clean)) {
      setError("Enter a valid GitHub username.");
      return;
    }
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const response = await fetch(`/api/github/contributions?username=${encodeURIComponent(clean)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load contributions.");
      setWrap(payload as ContributionWrap);
      setActiveYear("all");
      setUsername(clean);
      const url = new URL(window.location.href);
      url.searchParams.set("u", clean);
      window.history.replaceState(null, "", url);
    } catch (loadError) {
      setWrap(null);
      setError(loadError instanceof Error ? loadError.message : "Could not load contributions.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void loadUser(username);
  };

  const onDownload = async () => {
    if (!wrap) return;
    setDownloading(true);
    try {
      await downloadContributionWrap(
        wrap,
        activeYear === "all" ? undefined : [activeYear],
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link className={styles.navMark} href="/">WRAP<span>.</span></Link>
        <span className={styles.navMeta}>GITHUB / CONTRIBUTION WRAP</span>
        <a className={styles.navBack} href="https://github.com">GitHub</a>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Black · Green · Every square</p>
          <h1>Wrap your<br /><em>GitHub year.</em></h1>
          <p className={styles.lede}>
            Enter your GitHub username to open every contribution heatmap, inspect a day on desktop or mobile, and download the wrap as an image.
          </p>
          <form className={styles.search} onSubmit={onSubmit}>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="GitHub username"
              aria-label="GitHub username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <button type="submit" disabled={loading}>
              <Search size={14} /> {loading ? "Loading" : "Show wrap"}
            </button>
          </form>
          <div className={styles.examples}>
            <span>Try</span>
            {EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => void loadUser(example)}>
                {example}
              </button>
            ))}
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
        <aside className={styles.heroPanel}>
          <p className={styles.eyebrow}>How to inspect</p>
          <p>
            Hover a square on desktop. On mobile, tap or drag across the graph — the selected day stays pinned so you can read the count without covering the heatmap.
          </p>
        </aside>
      </section>

      <section className={styles.wrap}>
        {loading ? <div className={styles.skeleton} /> : null}

        {wrap && stats ? (
          <>
            <div className={styles.profile}>
              <Image className={styles.avatar} src={wrap.user.avatarUrl} alt="" width={84} height={84} />
              <div>
                <h2>{wrap.user.name || wrap.user.login}</h2>
                <a href={wrap.user.htmlUrl} target="_blank" rel="noreferrer">@{wrap.user.login}</a>
                {wrap.user.bio ? <p className={styles.bio}>{wrap.user.bio}</p> : null}
              </div>
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}><b>{wrap.allTimeTotal.toLocaleString()}</b><span>All-time contributions</span></div>
              <div className={styles.stat}><b>{wrap.lastYearTotal.toLocaleString()}</b><span>Last 12 months</span></div>
              <div className={styles.stat}><b>{stats.longest}</b><span>Longest streak</span></div>
              <div className={styles.stat}><b>{stats.current}</b><span>Current streak</span></div>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.yearChips}>
                <button
                  type="button"
                  className={`${styles.yearChip} ${activeYear === "all" ? styles.yearChipActive : ""}`}
                  onClick={() => setActiveYear("all")}
                >
                  All years
                </button>
                {wrap.years.map((year) => (
                  <button
                    key={year.year}
                    type="button"
                    className={`${styles.yearChip} ${activeYear === year.year ? styles.yearChipActive : ""}`}
                    onClick={() => setActiveYear(year.year)}
                  >
                    {year.year}
                  </button>
                ))}
              </div>
              <button className={styles.download} type="button" onClick={() => void onDownload()} disabled={downloading}>
                <Download size={14} /> {downloading ? "Preparing" : "Download image"}
              </button>
            </div>

            {visibleYears.map((year) => (
              <ContributionHeatmap
                key={year.year}
                year={year}
                selectedDate={selected?.date ?? null}
                onSelect={setSelected}
              />
            ))}

            <div className={styles.legend} aria-hidden>
              Less
              <i className={styles.level0} />
              <i className={styles.level1} />
              <i className={styles.level2} />
              <i className={styles.level3} />
              <i className={styles.level4} />
              More
            </div>

            <div className={styles.inspect}>
              {selected ? (
                <>
                  <div>
                    <strong>{selected.count.toLocaleString()}</strong>
                    <div>{selected.count === 1 ? "contribution" : "contributions"}</div>
                  </div>
                  <span>
                    {new Date(`${selected.date}T00:00:00Z`).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </>
              ) : (
                <span>Hover or tap a square to inspect that day. On a phone, slide across the graph.</span>
              )}
            </div>
          </>
        ) : null}
      </section>

      <footer className={styles.footer}>
        <span>WRAP.</span>
        <span>Public GitHub contribution calendars · black / green wrap</span>
      </footer>
    </main>
  );
}
