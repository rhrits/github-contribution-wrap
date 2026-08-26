"use client";

import type { ContributionWrap } from "@/lib/github-contributions";
import { computeAwards, wrapTokens } from "@/lib/awards";
import styles from "@/app/wrap.module.css";

export function AwardsBoard({ wrap }: { wrap: ContributionWrap }) {
  const awards = computeAwards(wrap);
  const tokens = wrapTokens(wrap);
  const earned = awards.filter((award) => award.earned).length;

  return (
    <section className={styles.awardsBoard}>
      <div className={styles.tokenBar}>
        <div>
          <p className={styles.eyebrow}>WRAP tokens</p>
          <strong>{tokens.toLocaleString()}</strong>
          <span>1 token per 50 contributions</span>
        </div>
        <div>
          <p className={styles.eyebrow}>Awards unlocked</p>
          <strong>{earned}/{awards.length}</strong>
          <span>Badges earned on this voyage</span>
        </div>
      </div>
      <div className={styles.badgeGrid}>
        {awards.map((award) => (
          <article
            key={award.id}
            className={`${styles.badge} ${styles[award.tone]} ${award.earned ? styles.badgeOn : styles.badgeOff}`}
          >
            <b>{award.earned ? "●" : "○"}</b>
            <h4>{award.name}</h4>
            <p>{award.blurb}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
