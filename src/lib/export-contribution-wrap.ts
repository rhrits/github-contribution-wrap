import type { ContributionWrap } from "@/lib/github-contributions";
import { computeStreaks, weeksFromDays } from "@/lib/github-contributions";

const LEVELS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export async function downloadContributionWrap(wrap: ContributionWrap, yearsToRender?: number[]) {
  const years = wrap.years.filter((year) => !yearsToRender || yearsToRender.includes(year.year));
  const allDays = years.flatMap((year) => year.days);
  const stats = computeStreaks(allDays);

  const width = 1400;
  const yearBlock = 168;
  const height = 280 + years.length * yearBlock;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#020403");
  background.addColorStop(0.45, "#050b07");
  background.addColorStop(1, "#000000");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#39d35318";
  ctx.beginPath();
  ctx.arc(1180, 80, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8bffb2";
  ctx.font = "600 18px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("GITHUB  /  CONTRIBUTION WRAP", 64, 56);

  const avatar = await loadImage(`${wrap.user.avatarUrl}${wrap.user.avatarUrl.includes("?") ? "&" : "?"}s=160`);
  ctx.save();
  roundRect(ctx, 64, 84, 88, 88, 16);
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, 64, 84, 88, 88);
  else {
    ctx.fillStyle = "#0e4429";
    ctx.fillRect(64, 84, 88, 88);
  }
  ctx.restore();
  ctx.strokeStyle = "#39d35355";
  ctx.lineWidth = 2;
  roundRect(ctx, 64, 84, 88, 88, 16);
  ctx.stroke();

  ctx.fillStyle = "#f4fff6";
  ctx.font = "700 42px Arial, Helvetica, sans-serif";
  ctx.fillText(wrap.user.name || wrap.user.login, 176, 124);
  ctx.fillStyle = "#39d353";
  ctx.font = "500 22px ui-monospace, Menlo, monospace";
  ctx.fillText(`@${wrap.user.login}`, 176, 156);

  const pills = [
    `${wrap.allTimeTotal.toLocaleString()} all-time`,
    `${wrap.lastYearTotal.toLocaleString()} last year`,
    `${stats.longest} day best streak`,
    stats.busiest ? `${stats.busiest.count} on ${stats.busiest.date}` : "quiet graph",
  ];
  ctx.font = "500 16px ui-monospace, Menlo, monospace";
  let pillX = 176;
  pills.forEach((pill) => {
    const pillWidth = ctx.measureText(pill).width + 28;
    roundRect(ctx, pillX, 172, pillWidth, 32, 16);
    ctx.fillStyle = "#0b1a12";
    ctx.fill();
    ctx.strokeStyle = "#39d35344";
    ctx.stroke();
    ctx.fillStyle = "#c6ffd4";
    ctx.fillText(pill, pillX + 14, 193);
    pillX += pillWidth + 12;
  });

  years.forEach((year, yearIndex) => {
    const originY = 236 + yearIndex * yearBlock;
    ctx.fillStyle = "#8bffb2";
    ctx.font = "600 18px ui-monospace, Menlo, monospace";
    ctx.fillText(String(year.year), 64, originY + 18);
    ctx.fillStyle = "#6f8a78";
    ctx.font = "500 14px ui-monospace, Menlo, monospace";
    ctx.fillText(`${year.total.toLocaleString()} contributions`, 130, originY + 18);

    const weeks = weeksFromDays(year.days);
    const size = 12;
    const gap = 4;
    weeks.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        const x = 64 + weekIndex * (size + gap);
        const y = originY + 32 + dayIndex * (size + gap);
        ctx.fillStyle = day ? LEVELS[Math.min(4, Math.max(0, day.level))] : "#0d1117";
        roundRect(ctx, x, y, size, size, 2);
        ctx.fill();
      });
    });
  });

  ctx.fillStyle = "#3f5548";
  ctx.font = "500 13px ui-monospace, Menlo, monospace";
  ctx.fillText("Less", 64, height - 36);
  LEVELS.forEach((color, index) => {
    ctx.fillStyle = color;
    roundRect(ctx, 108 + index * 18, height - 48, 12, 12, 2);
    ctx.fill();
  });
  ctx.fillStyle = "#3f5548";
  ctx.fillText("More", 204, height - 36);
  ctx.fillText("github.com/" + wrap.user.login, width - 320, height - 36);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${wrap.user.login}-github-wrap.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
