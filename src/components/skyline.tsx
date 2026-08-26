"use client";

import { weeksAsVoyages, type ContributionYear } from "@/lib/github-contributions";
import styles from "@/app/wrap.module.css";

export function Skyline({ year }: { year: ContributionYear }) {
  const voyages = weeksAsVoyages(year.days);
  const max = Math.max(1, ...voyages.map((voyage) => voyage.total));

  return (
    <section className={styles.sceneCard}>
      <div className={styles.yearHead}>
        <h3>{year.year} skyline</h3>
        <p>Buildings rise from weekly commits · windows are active days</p>
      </div>
      <div className={styles.skyline}>
        {voyages.map((voyage, index) => {
          const height = 16 + (voyage.total / max) * 140;
          return (
            <div
              key={voyage.start}
              className={styles.building}
              style={{ height, animationDelay: `${index * 0.03}s` }}
              title={`${voyage.total} contributions week of ${voyage.start}`}
            >
              {voyage.days.slice(0, 6).map((day) => (
                <span
                  key={day.date}
                  className={day.count > 0 ? styles.windowOn : styles.windowOff}
                />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
