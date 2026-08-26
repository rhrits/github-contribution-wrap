export const THEMES = [
  { id: "forest", label: "Forest", hint: "Classic black / green" },
  { id: "ocean", label: "Ocean", hint: "Harbor nights and tide" },
  { id: "skyline", label: "Skyline", hint: "City of commits" },
  { id: "aurora", label: "Aurora", hint: "North-light code" },
  { id: "ember", label: "Ember", hint: "Forge and fire" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type ViewId = "grid" | "fleet" | "skyline" | "current";

export const VIEWS = [
  { id: "grid", label: "Heatmap" },
  { id: "fleet", label: "Harbor fleet" },
  { id: "skyline", label: "Skyline" },
  { id: "current", label: "Commit current" },
] as const;
