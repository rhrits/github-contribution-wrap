import type { ContributionDay } from "@/lib/github-contributions";

export type TrafficKind = "gig" | "corporate";

export type District = {
  id: string;
  name: string;
  tag: string;
  x: number;
  y: number;
  kind: TrafficKind | "mixed";
};

export type Corridor = {
  id: string;
  name: string;
  kind: TrafficKind;
  path: string;
};

export type RoadCell = {
  id: string;
  corridorId: string;
  x: number;
  y: number;
  kind: TrafficKind;
};

export type MapCell = RoadCell & {
  total: number;
  level: number;
  days: ContributionDay[];
};

export type TrafficUnit = {
  id: string;
  kind: TrafficKind;
  path: string;
  level: number;
  count: number;
  date: string;
  delay: number;
  duration: number;
};

export type DistrictStat = {
  district: District;
  total: number;
  gig: number;
  corporate: number;
  activeDays: number;
};

export const MAP = { width: 1000, height: 900 } as const;

export const DISTRICTS: District[] = [
  { id: "yelahanka", name: "Yelahanka", tag: "North gate", x: 500, y: 72, kind: "mixed" },
  { id: "hebbal", name: "Hebbal", tag: "Flyover / Manyata link", x: 502, y: 178, kind: "corporate" },
  { id: "manyata", name: "Manyata", tag: "Tech park", x: 590, y: 228, kind: "corporate" },
  { id: "krpuram", name: "KR Puram", tag: "ORR east", x: 722, y: 248, kind: "mixed" },
  { id: "whitefield", name: "Whitefield", tag: "ITPL · EPIP", x: 868, y: 338, kind: "corporate" },
  { id: "marathahalli", name: "Marathahalli", tag: "Bridge jam", x: 728, y: 378, kind: "corporate" },
  { id: "indiranagar", name: "Indiranagar", tag: "100 ft road", x: 608, y: 398, kind: "gig" },
  { id: "mgroad", name: "MG Road", tag: "CBD", x: 478, y: 418, kind: "corporate" },
  { id: "malleshwaram", name: "Malleshwaram", tag: "West grid", x: 358, y: 338, kind: "gig" },
  { id: "rajaji", name: "Rajajinagar", tag: "Tumkur Road", x: 318, y: 382, kind: "mixed" },
  { id: "koramangala", name: "Koramangala", tag: "Startup belt", x: 548, y: 502, kind: "gig" },
  { id: "bellandur", name: "Bellandur", tag: "ORR lake", x: 708, y: 488, kind: "corporate" },
  { id: "hsr", name: "HSR Layout", tag: "Gig dens", x: 628, y: 562, kind: "gig" },
  { id: "sarjapur", name: "Sarjapur", tag: "Outer tech", x: 768, y: 568, kind: "corporate" },
  { id: "silkboard", name: "Silk Board", tag: "Legendary jam", x: 548, y: 608, kind: "corporate" },
  { id: "jayanagar", name: "Jayanagar", tag: "South grid", x: 418, y: 608, kind: "gig" },
  { id: "ecity", name: "Electronic City", tag: "Phase 1 · Hosur", x: 518, y: 788, kind: "corporate" },
];

export const CORRIDORS: Corridor[] = [
  {
    id: "orr",
    name: "Outer Ring Road",
    kind: "corporate",
    path: "M 500 176 C 718 176 828 286 828 418 C 828 572 708 676 500 676 C 292 676 172 572 172 418 C 172 286 282 176 500 176",
  },
  {
    id: "hosur",
    name: "Hosur Road",
    kind: "corporate",
    path: "M 478 418 L 548 608 L 518 788",
  },
  {
    id: "airport",
    name: "Old Airport Road",
    kind: "corporate",
    path: "M 478 418 L 608 398 L 728 378 L 868 338",
  },
  {
    id: "sarjapur",
    name: "Sarjapur Road",
    kind: "gig",
    path: "M 548 502 L 628 562 L 708 488 L 768 568",
  },
  {
    id: "bellary",
    name: "Bellary Road",
    kind: "corporate",
    path: "M 478 418 L 502 178 L 500 72",
  },
  {
    id: "whitefield-main",
    name: "Whitefield Main",
    kind: "corporate",
    path: "M 722 248 L 868 338 L 728 378",
  },
  {
    id: "inner",
    name: "Inner Ring",
    kind: "gig",
    path: "M 358 338 L 478 418 L 548 502 L 418 608",
  },
  {
    id: "tumkur",
    name: "Tumkur Road",
    kind: "corporate",
    path: "M 318 382 L 358 338 L 338 268 L 502 178",
  },
  {
    id: "bannerghatta",
    name: "Bannerghatta Road",
    kind: "gig",
    path: "M 418 608 L 398 688 L 428 780",
  },
  {
    id: "hundred",
    name: "100 ft Road",
    kind: "gig",
    path: "M 608 398 L 548 502 L 628 562",
  },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function ellipseCells(cx: number, cy: number, rx: number, ry: number, count: number, corridorId: string, kind: TrafficKind): RoadCell[] {
  return Array.from({ length: count }, (_, index) => {
    const t = (index / count) * Math.PI * 2;
    return {
      id: `${corridorId}-${index}`,
      corridorId,
      kind,
      x: cx + rx * Math.cos(t),
      y: cy + ry * Math.sin(t),
    };
  });
}

function lineCells(points: [number, number][], stepsPerSeg: number, corridorId: string, kind: TrafficKind): RoadCell[] {
  const cells: RoadCell[] = [];
  for (let segment = 0; segment < points.length - 1; segment += 1) {
    const [x0, y0] = points[segment];
    const [x1, y1] = points[segment + 1];
    for (let step = 0; step < stepsPerSeg; step += 1) {
      const t = step / stepsPerSeg;
      cells.push({
        id: `${corridorId}-${segment}-${step}`,
        corridorId,
        kind,
        x: lerp(x0, x1, t),
        y: lerp(y0, y1, t),
      });
    }
  }
  cells.push({
    id: `${corridorId}-end`,
    corridorId,
    kind,
    x: points[points.length - 1][0],
    y: points[points.length - 1][1],
  });
  return cells;
}

export function buildRoadCells(): RoadCell[] {
  return [
    ...ellipseCells(500, 426, 328, 250, 72, "orr", "corporate"),
    ...lineCells([[478, 418], [548, 608], [518, 788]], 14, "hosur", "corporate"),
    ...lineCells([[478, 418], [608, 398], [728, 378], [868, 338]], 10, "airport", "corporate"),
    ...lineCells([[548, 502], [628, 562], [708, 488], [768, 568]], 8, "sarjapur", "gig"),
    ...lineCells([[478, 418], [502, 178], [500, 72]], 12, "bellary", "corporate"),
    ...lineCells([[722, 248], [868, 338], [728, 378]], 8, "whitefield-main", "corporate"),
    ...lineCells([[358, 338], [478, 418], [548, 502], [418, 608]], 8, "inner", "gig"),
    ...lineCells([[318, 382], [358, 338], [338, 268], [502, 178]], 7, "tumkur", "corporate"),
    ...lineCells([[418, 608], [398, 688], [428, 780]], 8, "bannerghatta", "gig"),
    ...lineCells([[608, 398], [548, 502], [628, 562]], 8, "hundred", "gig"),
  ];
}

function levelFromTotal(total: number, peak: number) {
  if (total <= 0) return 0;
  const ratio = total / Math.max(1, peak);
  if (ratio > 0.72) return 4;
  if (ratio > 0.48) return 3;
  if (ratio > 0.24) return 2;
  return 1;
}

function nearestDistrict(x: number, y: number) {
  let best = DISTRICTS[0];
  let bestDist = Infinity;
  for (const district of DISTRICTS) {
    const dx = district.x - x;
    const dy = district.y - y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      best = district;
      bestDist = dist;
    }
  }
  return best;
}

function weekday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function kindForDay(day: ContributionDay, cell: RoadCell): TrafficKind {
  const dayIndex = weekday(day.date);
  const weekend = dayIndex === 0 || dayIndex === 6;
  if (day.level >= 3 && !weekend) return "corporate";
  if (day.level <= 1 || weekend) return "gig";
  return cell.kind;
}

export function paintBengaluruTraffic(days: ContributionDay[]) {
  const roads = buildRoadCells();
  const painted: MapCell[] = roads.map((cell) => ({ ...cell, total: 0, level: 0, days: [] }));
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach((day, index) => {
    if (!painted.length) return;
    const corporateBias = day.level >= 3 ? 2 : 0;
    const slot = (hashString(day.date) + index * (3 + corporateBias)) % painted.length;
    const cell = painted[slot];
    cell.days.push(day);
    cell.total += day.count;
  });

  const peak = Math.max(1, ...painted.map((cell) => cell.total));
  for (const cell of painted) {
    cell.level = cell.days.length ? Math.max(levelFromTotal(cell.total, peak), Math.min(4, Math.max(...cell.days.map((day) => day.level)))) : 0;
  }

  const corridorById = new Map(CORRIDORS.map((corridor) => [corridor.id, corridor]));
  const vehicles: TrafficUnit[] = [];
  for (const cell of painted) {
    if (cell.total <= 0) continue;
    const peakDay = cell.days.reduce((best, day) => (day.count > best.count ? day : best), cell.days[0]);
    const kind = kindForDay(peakDay, cell);
    const corridor = corridorById.get(cell.corridorId);
    if (!corridor) continue;
    const density = Math.min(3, 1 + Math.floor(cell.level / 2));
    for (let copy = 0; copy < density; copy += 1) {
      vehicles.push({
        id: `${cell.id}-v${copy}`,
        kind,
        path: corridor.path,
        level: cell.level,
        count: cell.total,
        date: peakDay.date,
        delay: (hashString(cell.id) % 1200) / 100 + copy * 1.7,
        duration: kind === "gig" ? 11 + (hashString(cell.id) % 7) : 16 + (hashString(cell.id) % 8),
      });
    }
  }

  const districtMap = new Map<string, DistrictStat>();
  for (const district of DISTRICTS) {
    districtMap.set(district.id, { district, total: 0, gig: 0, corporate: 0, activeDays: 0 });
  }
  for (const cell of painted) {
    if (!cell.days.length) continue;
    const district = nearestDistrict(cell.x, cell.y);
    const stat = districtMap.get(district.id);
    if (!stat) continue;
    for (const day of cell.days) {
      const kind = kindForDay(day, cell);
      stat.total += day.count;
      stat.activeDays += day.count > 0 ? 1 : 0;
      if (kind === "gig") stat.gig += day.count;
      else stat.corporate += day.count;
    }
  }

  const districts = [...districtMap.values()].sort((a, b) => b.total - a.total);
  const gigTotal = vehicles.filter((unit) => unit.kind === "gig").reduce((sum, unit) => sum + unit.count, 0);
  const corporateTotal = vehicles.filter((unit) => unit.kind === "corporate").reduce((sum, unit) => sum + unit.count, 0);

  return {
    cells: painted,
    vehicles: vehicles.slice(0, 96),
    districts,
    gigTotal,
    corporateTotal,
    peak,
  };
}

export function formatIstDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
