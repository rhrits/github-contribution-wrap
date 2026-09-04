"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { ContributionWrap } from "@/lib/github-contributions";
import { computeStreaks, isValidUsername, normalizeUsername } from "@/lib/github-contributions";
import { BrandLogo } from "@/components/brand-logo";
import { BengaluruCity } from "@/components/bengaluru-city";
import { paintBengaluruTraffic, type TrafficKind } from "@/lib/bengaluru-map";
import styles from "./bengaluru.module.css";

const EXAMPLES = ["rhrits", "gaearon", "torvalds", "octocat"];

export function BengaluruClient({ initialUsername = "" }: { initialUsername?: string }) {
  const [username, setUsername] = useState(initialUsername);
  const [wrap, setWrap] = useState<ContributionWrap | null>(null);
  const [activeYear, setActiveYear] = useState<number | "latest">("latest");
  const [filter, setFilter] = useState<"all" | TrafficKind>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const booted = useRef(false);

  const year = useMemo(() => {
    if (!wrap?.years.length) return null;
    if (activeYear === "latest") return wrap.years[0];
    return wrap.years.find((item) => item.year === activeYear) ?? wrap.years[0];
  }, [wrap, activeYear]);

  const traffic = useMemo(() => (year ? paintBengaluruTraffic(year.days) : null), [year]);
  const stats = useMemo(() => (wrap ? computeStreaks(wrap.years.flatMap((item) => item.days)) : null), [wrap]);

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
    try {
      const response = await fetch(`/api/github/contributions?username=${encodeURIComponent(clean)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load contributions.");
      setWrap(payload as ContributionWrap);
      setActiveYear("latest");
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

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link href="/"><BrandLogo /></Link>
        <nav className={styles.navLinks}>
          <Link href="/">Wrap</Link>
          <Link href="/bengaluru" aria-current="page">Bengaluru map</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>India · Bengaluru tech city · 3D traffic wrap</p>
          <h1>Your commits as<br /><em>Bengaluru traffic.</em></h1>
          <p className={styles.lede}>
            The GitHub contribution graph becomes Outer Ring Road, Silk Board, Whitefield and HSR.
            Gig workers on scooties carry lighter days. Corporate cabs carry the streaks.
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
              <Search size={14} /> {loading ? "Mapping" : "Map traffic"}
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
        <aside className={styles.heroCard}>
          <p className={styles.eyebrow}>How to read the city</p>
          <p>
            Drag the map to orbit. Green blocks are contribution density on Bengaluru roads.
            Amber pins are gig corridors. Blue pins are corporate parks. Top locations rank by how many of your commits jammed that neighbourhood.
          </p>
        </aside>
      </section>

      {loading ? <div className={styles.skeleton} /> : null}

      {wrap && stats && year && traffic ? (
        <>
          <div className={styles.profile}>
            <Image className={styles.avatar} src={wrap.user.avatarUrl} alt={`${wrap.user.login} avatar`} width={64} height={64} />
            <div>
              <h2>{wrap.user.name || wrap.user.login}</h2>
              <a href={wrap.user.htmlUrl} target="_blank" rel="noreferrer">@{wrap.user.login}</a>
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}><b>{year.total.toLocaleString()}</b><span>{year.year} on the roads</span></div>
            <div className={styles.stat}><b>{traffic.districts.filter((item) => item.total > 0).length}</b><span>Live locations</span></div>
            <div className={styles.stat}><b>{traffic.vehicles.filter((item) => item.kind === "gig").length}</b><span>Gig scooties</span></div>
            <div className={styles.stat}><b>{traffic.vehicles.filter((item) => item.kind === "corporate").length}</b><span>Corporate cabs</span></div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.yearChips}>
              <button
                type="button"
                className={`${styles.yearChip} ${activeYear === "latest" ? styles.yearChipActive : ""}`}
                onClick={() => setActiveYear("latest")}
              >
                Latest year
              </button>
              {wrap.years.slice(0, 8).map((item) => (
                <button
                  key={item.year}
                  type="button"
                  className={`${styles.yearChip} ${activeYear === item.year ? styles.yearChipActive : ""}`}
                  onClick={() => setActiveYear(item.year)}
                >
                  {item.year}
                </button>
              ))}
            </div>
            <div className={styles.filters}>
              {([
                ["all", "All traffic"],
                ["gig", "Gig scooties"],
                ["corporate", "Corporate"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.filter} ${filter === id ? styles.filterActive : ""}`}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sceneWrap}>
            <BengaluruCity year={year} filter={filter} />
          </div>

          <section className={styles.places}>
            <h2>Top locations</h2>
            <div className={styles.grid}>
              {traffic.districts.slice(0, 8).map((item, index) => {
                const max = Math.max(1, traffic.districts[0]?.total ?? 1);
                return (
                  <article key={item.district.id} className={styles.place}>
                    <small>0{index + 1} · {item.district.tag}</small>
                    <strong>{item.total.toLocaleString()}</strong>
                    <span>{item.district.name}</span>
                    <div className={styles.bars}>
                      <div>
                        Gig
                        <i className={styles.gigBar} style={{ width: `${Math.max(8, (item.gig / max) * 100)}%` }} />
                      </div>
                      <div>
                        Corporate
                        <i className={styles.cabBar} style={{ width: `${Math.max(8, (item.corporate / max) * 100)}%` }} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className={styles.legendRow}>
              <div className={styles.legendCard}>
                <p className={styles.eyebrow}>Contribution legend</p>
                <p>Less congestion to Silk Board glow — the same five GitHub greens, painted on Bengaluru asphalt.</p>
                <div className={styles.swatches} aria-hidden>
                  <i style={{ background: "#161b22" }} />
                  <i style={{ background: "#0e4429" }} />
                  <i style={{ background: "#006d32" }} />
                  <i style={{ background: "#26a641" }} />
                  <i style={{ background: "#39d353" }} />
                </div>
              </div>
              <div className={styles.legendCard}>
                <p className={styles.eyebrow}>Traffic split</p>
                <p>
                  {traffic.gigTotal.toLocaleString()} gig pulses · {traffic.corporateTotal.toLocaleString()} corporate pulses in {year.year}.
                  Longest streak on the wrap: {stats.longest} days.
                </p>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <footer className={styles.footer}>
        <span>
          Built by Hritik Raj ·
          <a href="https://github.com/rhrits" target="_blank" rel="noreferrer"> @rhrits</a>
        </span>
        <span>Bengaluru · GitHub traffic wrap</span>
      </footer>
    </main>
  );
}
