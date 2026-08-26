"use client";

import { weeksAsVoyages, type ContributionYear } from "@/lib/github-contributions";
import styles from "@/app/wrap.module.css";

export function CommitCurrent({ year }: { year: ContributionYear }) {
  const voyages = weeksAsVoyages(year.days);
  const max = Math.max(1, ...voyages.map((voyage) => voyage.total));
  const width = 920;
  const height = 220;
  const step = width / Math.max(1, voyages.length - 1);
  const points = voyages.map((voyage, index) => {
    const x = index * step;
    const y = height - 24 - (voyage.total / max) * (height - 48);
    return [x, y] as const;
  });
  const path = points.reduce((d, [x, y], index) => {
    if (index === 0) return `M ${x} ${y}`;
    const [px, py] = points[index - 1];
    const cx = (px + x) / 2;
    return `${d} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, "");
  const crest = voyages.reduce((best, voyage) => (voyage.total > best.total ? voyage : best), voyages[0]);
  const motionId = `motion-${year.year}`;

  return (
    <section className={styles.sceneCard}>
      <div className={styles.yearHead}>
        <h3>{year.year} commit current</h3>
        <p>A chart GitHub does not ship: your year drawn as a live ocean current, with a cutter riding the crest.</p>
      </div>
      <svg className={styles.currentSvg} viewBox="0 0 920 240" role="img" aria-label={`Commit current for ${year.year}`}>
        <defs>
          <linearGradient id={`current-${year.year}`} x1="0" x2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke={`url(#current-${year.year})`} strokeWidth="8" strokeLinecap="round" />
        <path id={motionId} d={path} fill="none" stroke="none" />
        {path ? (
          <polygon points="-12,-8 16,0 -12,8" fill="currentColor">
            <animateMotion dur="10s" repeatCount="indefinite" rotate="auto">
              <mpath href={`#${motionId}`} />
            </animateMotion>
          </polygon>
        ) : null}
      </svg>
      {crest ? (
        <p className={styles.currentNote}>
          Crest week of {crest.start}: {crest.total.toLocaleString()} commits. The cutter follows the current, not the calendar grid.
        </p>
      ) : null}
    </section>
  );
}
