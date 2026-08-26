"use client";

import type { ContributionWrap } from "@/lib/github-contributions";
import styles from "@/app/wrap.module.css";

export function StackHarbor({ wrap }: { wrap: ContributionWrap }) {
  const languages = wrap.stack.filter((item) => item.kind === "language");
  const topics = wrap.stack.filter((item) => item.kind === "topic");
  const max = Math.max(1, ...languages.map((item) => item.repos));

  return (
    <section className={styles.sceneCard}>
      <div className={styles.yearHead}>
        <h3>Tech stack</h3>
        <p>Languages and topics from public work</p>
      </div>
      <div className={styles.stackBars}>
        {languages.length ? languages.map((item) => (
          <div key={item.name} className={styles.stackRow}>
            <span>{item.name}</span>
            <i style={{ width: `${(item.repos / max) * 100}%` }} />
            <b>{item.repos}</b>
          </div>
        )) : <p className={styles.emptyNote}>No public language signal yet.</p>}
      </div>
      {topics.length ? (
        <div className={styles.topicCloud}>
          {topics.map((item) => (
            <span key={item.name}>{item.name}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
