"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ContributionYear } from "@/lib/github-contributions";
import { CORRIDORS, DISTRICTS, MAP, paintBengaluruTraffic, type TrafficKind } from "@/lib/bengaluru-map";
import styles from "@/app/bengaluru/bengaluru.module.css";

function Scooty({ kind }: { kind: TrafficKind }) {
  if (kind === "gig") {
    return (
      <svg viewBox="0 0 48 28" className={styles.vehicleSvg} aria-hidden>
        <circle cx="10" cy="22" r="5" fill="#111" />
        <circle cx="10" cy="22" r="2.2" fill="#9ca3af" />
        <circle cx="36" cy="22" r="5.4" fill="#111" />
        <circle cx="36" cy="22" r="2.4" fill="#9ca3af" />
        <path d="M14 20 L22 12 H30 L34 20" fill="none" stroke="#39d353" strokeWidth="2.4" strokeLinejoin="round" />
        <rect x="21" y="8" width="10" height="5" rx="1.5" fill="#6ee7b7" />
        <circle cx="26" cy="7" r="3.2" fill="#fbbf24" />
        <path d="M8 20 H16" stroke="#22c55e" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 54 24" className={styles.vehicleSvg} aria-hidden>
      <rect x="6" y="8" width="38" height="10" rx="3" fill="#e2e8f0" />
      <path d="M16 8 L22 3 H36 L42 8" fill="#94a3b8" />
      <rect x="23" y="4" width="8" height="5" rx="1" fill="#38bdf8" />
      <circle cx="14" cy="19" r="4.2" fill="#0f172a" />
      <circle cx="38" cy="19" r="4.2" fill="#0f172a" />
      <rect x="8" y="11" width="6" height="3" fill="#facc15" />
    </svg>
  );
}

export function BengaluruCity({
  year,
  filter = "all",
}: {
  year: ContributionYear;
  filter?: "all" | TrafficKind;
}) {
  const worldRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; rx: number; rz: number } | null>(null);
  const [tilt, setTilt] = useState({ rx: 58, rz: -24 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const traffic = useMemo(() => paintBengaluruTraffic(year.days), [year.days]);
  const selected = traffic.cells.find((cell) => cell.id === selectedId) ?? null;

  const vehicles = traffic.vehicles.filter((unit) => filter === "all" || unit.kind === filter);
  const cells = traffic.cells;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, rx: tilt.rx, rz: tilt.rz };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    setTilt({
      rx: Math.min(72, Math.max(28, drag.current.rx - dy * 0.12)),
      rz: Math.min(18, Math.max(-48, drag.current.rz + dx * 0.12)),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <section className={styles.sceneCard}>
      <div className={styles.sceneHead}>
        <div>
          <h3>{year.year} Bengaluru traffic</h3>
          <p>GitHub greens are congestion. Scooties are gig commits. Cabs are corporate streaks.</p>
        </div>
        <p className={styles.hint}>Drag to orbit · {year.total.toLocaleString()} contributions on the ring</p>
      </div>

      <div
        className={styles.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={styles.sky} aria-hidden />
        <div className={styles.haze} aria-hidden />
        <div className={styles.worldFrame}>
        <div
          ref={worldRef}
          className={styles.world}
          style={{ transform: `rotateX(${tilt.rx}deg) rotateZ(${tilt.rz}deg)` }}
        >
          <div className={styles.ground}>
            <div className={styles.lake} style={{ left: "66%", top: "52%" }} />
            <div className={styles.lake} style={{ left: "58%", top: "41%", width: 70, height: 42 }} />
            <div className={styles.park} style={{ left: "44%", top: "44%" }} />
            <svg className={styles.roads} viewBox={`0 0 ${MAP.width} ${MAP.height}`}>
              {CORRIDORS.map((corridor) => (
                <path
                  key={corridor.id}
                  d={corridor.path}
                  className={corridor.kind === "gig" ? styles.roadGig : styles.roadCorp}
                />
              ))}
            </svg>

            {cells.map((cell) => (
              <button
                key={cell.id}
                type="button"
                className={`${styles.tile} ${styles[`lvl${cell.level}`]} ${selectedId === cell.id ? styles.tileOn : ""}`}
                style={{
                  left: cell.x,
                  top: cell.y,
                  height: 8 + cell.level * 7,
                  transform: `translate(-50%, -50%) translateZ(${4 + cell.level * 6}px)`,
                }}
                aria-label={`${cell.total} contributions on this stretch`}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(cell.id);
                }}
              />
            ))}

            {DISTRICTS.map((district) => (
              <div
                key={`${district.id}-tower`}
                className={`${styles.tower} ${district.kind === "gig" ? styles.towerGig : styles.towerCorp}`}
                style={{
                  left: district.x,
                  top: district.y,
                  height: district.kind === "corporate" ? 46 : district.kind === "gig" ? 28 : 36,
                }}
              />
            ))}

            {DISTRICTS.map((district) => (
              <div
                key={district.id}
                className={styles.pin}
                style={{ left: district.x, top: district.y }}
              >
                <i className={district.kind === "gig" ? styles.pinGig : styles.pinCorp} />
                <b>{district.name}</b>
              </div>
            ))}

            {vehicles.map((unit) => (
              <div
                key={unit.id}
                className={`${styles.rider} ${unit.kind === "gig" ? styles.gig : styles.cab}`}
                style={{
                  offsetPath: `path("${unit.path}")`,
                  animationDuration: `${unit.duration}s`,
                  animationDelay: `${-unit.delay}s`,
                }}
                title={`${unit.kind} · ${unit.count} contributions · ${unit.date}`}
              >
                <Scooty kind={unit.kind} />
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {selected ? (
        <p className={styles.inspectLine}>
          <strong>{selected.total.toLocaleString()}</strong> contributions stacked on this {selected.kind === "gig" ? "gig" : "corporate"} stretch
          {selected.days[0] ? ` · first pulse ${selected.days[0].date}` : ""}
        </p>
      ) : (
        <p className={styles.inspectLine}>Tap a glowing block to inspect that stretch of Bengaluru.</p>
      )}
    </section>
  );
}
