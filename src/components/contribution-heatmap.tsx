"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ContributionDay, ContributionYear } from "@/lib/github-contributions";
import { monthLabels, weeksFromDays } from "@/lib/github-contributions";
import styles from "@/app/wrap.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDay(day: ContributionDay) {
  const date = new Date(`${day.date}T00:00:00Z`);
  const label = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  if (day.count === 0) return `No contributions on ${label}`;
  if (day.count === 1) return `1 contribution on ${label}`;
  return `${day.count.toLocaleString()} contributions on ${label}`;
}

export function ContributionHeatmap({
  year,
  selectedDate,
  onSelect,
}: {
  year: ContributionYear;
  selectedDate: string | null;
  onSelect: (day: ContributionDay | null) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ day: ContributionDay; x: number; y: number } | null>(null);
  const weeks = useMemo(() => weeksFromDays(year.days), [year.days]);
  const months = useMemo(() => monthLabels(weeks), [weeks]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollLeft = node.scrollWidth;
  }, [year.year, weeks.length]);

  const showTip = (day: ContributionDay, target: HTMLElement) => {
    const parent = scrollerRef.current?.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    if (!parent) return;
    setHover({
      day,
      x: box.left - parent.left + box.width / 2 + (scrollerRef.current?.scrollLeft ?? 0),
      y: box.top - parent.top,
    });
    onSelect(day);
  };

  const hideTip = () => setHover(null);

  return (
    <section className={styles.yearCard}>
      <div className={styles.yearHead}>
        <h3>{year.year}</h3>
        <p>{year.total.toLocaleString()} contributions</p>
      </div>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        onPointerLeave={() => hideTip()}
      >
        <div className={styles.calendar}>
          <div className={styles.weekdayCol} aria-hidden>
            <span className={styles.weekdayHidden}> </span>
            {WEEKDAYS.map((day, index) => (
              <span key={day} className={index % 2 ? styles.weekday : styles.weekdayHidden}>{day}</span>
            ))}
          </div>
          <div className={styles.gridWrap}>
            <div
              className={styles.monthRow}
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
              {weeks.map((_, weekIndex) => {
                const month = months.find((item) => item.week === weekIndex);
                return <span key={weekIndex}>{month?.label ?? ""}</span>;
              })}
            </div>
            <div
              className={styles.grid}
            >
              {weeks.map((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  if (!day) {
                    return <span key={`${weekIndex}-${dayIndex}`} className={styles.empty} />;
                  }
                  return (
                    <button
                      key={day.date}
                      type="button"
                      data-date={day.date}
                      style={{ "--i": weekIndex * 7 + dayIndex } as CSSProperties}
                      className={`${styles.cell} ${styles[`level${Math.min(4, day.level)}`]} ${selectedDate === day.date ? styles.cellActive : ""}`}
                      aria-label={formatDay(day)}
                      onPointerEnter={(event) => showTip(day, event.currentTarget)}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        showTip(day, event.currentTarget);
                      }}
                      onPointerMove={(event) => {
                        const node = document.elementFromPoint(event.clientX, event.clientY);
                        const date = node instanceof HTMLElement ? node.dataset.date : null;
                        if (!date) return;
                        const next = year.days.find((item) => item.date === date);
                        if (next && node instanceof HTMLElement) showTip(next, node);
                      }}
                      onFocus={(event) => showTip(day, event.currentTarget)}
                    />
                  );
                }),
              )}
            </div>
          </div>
          {hover ? (
            <div
              className={styles.tooltip}
              style={{ left: hover.x, top: hover.y }}
              role="status"
            >
              <strong>{hover.day.count.toLocaleString()}</strong>
              <span>{formatDay(hover.day)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
