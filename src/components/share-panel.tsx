"use client";

import { useState } from "react";
import { Camera, Link2, Send, Share2 } from "lucide-react";
import type { ContributionWrap } from "@/lib/github-contributions";
import { generateThought, linkedInIntent, twitterIntent, wrapShareUrl } from "@/lib/share-thought";
import styles from "@/app/wrap.module.css";

export function SharePanel({ wrap }: { wrap: ContributionWrap }) {
  const [copied, setCopied] = useState("");
  const url = wrapShareUrl(wrap.user.login);
  const thought = generateThought(wrap);

  const copy = async (label: string) => {
    await navigator.clipboard.writeText(`${thought}\n${url}`);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 4000);
  };

  return (
    <section className={styles.shareCard}>
      <div className={styles.yearHead}>
        <h3>Share the voyage</h3>
        <p>A ready thought for X, LinkedIn, and Instagram</p>
      </div>
      <blockquote className={styles.thought}>{thought}</blockquote>
      <div className={styles.shareRow}>
        <a className={styles.shareBtn} href={twitterIntent(thought, url)} target="_blank" rel="noreferrer">
          <Send size={14} /> X / Twitter
        </a>
        <a className={styles.shareBtn} href={linkedInIntent(url)} target="_blank" rel="noreferrer">
          <Link2 size={14} /> LinkedIn
        </a>
        <button type="button" className={styles.shareBtn} onClick={() => void copy("instagram")}>
          <Camera size={14} /> Instagram caption
        </button>
        <button type="button" className={styles.shareBtn} onClick={() => void copy("clipboard")}>
          <Share2 size={14} /> Copy thought + link
        </button>
      </div>
      {copied ? (
        <p className={styles.copyNote}>
          {copied === "instagram"
            ? "Caption copied. Open Instagram, paste the thought, and attach your downloaded wrap image."
            : "Thought and link copied."}
        </p>
      ) : (
        <p className={styles.copyNote}>Instagram has no web composer — copy the caption, then post the PNG you download.</p>
      )}
    </section>
  );
}
