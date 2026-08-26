"use client";

import type { ContributionWrap } from "@/lib/github-contributions";
import styles from "@/app/wrap.module.css";

export function StackHarbor({ wrap }: { wrap: ContributionWrap }) {
  const languages = wrap.stack.filter((item) => item.kind === "language");
  const topics = wrap.stack.filter((item) => item.kind === "topic");
  const max = Math.max(1, ...wrap.stack.map((item) => item.repos));

  return (
    <div className={styles.split}>
      <section className={styles.sceneCard}>
        <div className={styles.yearHead}>
          <h3>Top public repos</h3>
          <p>Flagships by stars, owned by @{wrap.user.login}</p>
        </div>
        <ul className={styles.repoList}>
          {wrap.topRepos.length ? wrap.topRepos.map((repo, index) => (
            <li key={repo.htmlUrl}>
              <a href={repo.htmlUrl} target="_blank" rel="noreferrer">
                <span className={styles.repoIndex}>{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{repo.name}</strong>
                  <small>{repo.description || "No description"}</small>
                </span>
                <em>{repo.stars.toLocaleString()}★ · {repo.language || "mixed"}</em>
              </a>
            </li>
          )) : <li className={styles.emptyNote}>No public original repos found.</li>}
        </ul>
      </section>
      <section className={styles.sceneCard}>
        <div className={styles.yearHead}>
          <h3>Tech stack cargo</h3>
          <p>Languages and topics loaded from public repositories</p>
        </div>
        <div className={styles.stackBars}>
          {languages.map((item) => (
            <div key={item.name} className={styles.stackRow}>
              <span>{item.name}</span>
              <i style={{ width: `${(item.repos / max) * 100}%` }} />
              <b>{item.repos}</b>
            </div>
          ))}
        </div>
        {topics.length ? (
          <div className={styles.topicCloud}>
            {topics.map((item) => (
              <span key={item.name}>{item.name}</span>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
