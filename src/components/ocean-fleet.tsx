"use client";

import { weeksAsVoyages, type ContributionYear } from "@/lib/github-contributions";
import styles from "@/app/wrap.module.css";

export function OceanFleet({ year }: { year: ContributionYear }) {
  const voyages = weeksAsVoyages(year.days);
  const max = Math.max(1, ...voyages.map((voyage) => voyage.total));

  return (
    <section className={styles.sceneCard}>
      <div className={styles.yearHead}>
        <h3>{year.year} harbor fleet</h3>
        <p>{year.total.toLocaleString()} cargo · each ship is one week</p>
      </div>
      <div className={styles.ocean}>
        <div className={styles.oceanGlow} />
        <div className={styles.wave} />
        <div className={`${styles.wave} ${styles.waveTwo}`} />
        <div className={styles.fleet}>
          {voyages.map((voyage, index) => {
            const size = 10 + (voyage.total / max) * 28;
            const sunk = voyage.total === 0;
            return (
              <div
                key={voyage.start}
                className={`${styles.ship} ${sunk ? styles.shipIdle : ""}`}
                style={{ animationDelay: `${(index % 7) * 0.18}s`, width: size, height: size * 0.72 }}
                title={`${voyage.total} contributions week of ${voyage.start}`}
              >
                <i className={styles.sail} />
                <b className={styles.hull} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
