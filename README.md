# GitHub Contribution Wrap

A standalone Next.js app that wraps public GitHub contribution calendars.

- Enter any GitHub username
- View every year heatmap in a black and green theme
- Hover on desktop, tap or slide on mobile to inspect a day
- Download a PNG of the wrap

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add `?u=your-username` to load a profile immediately.

Set `NEXT_PUBLIC_SITE_URL` to the public origin (for example `https://your-domain.com`) so sitemap, Open Graph, and canonical URLs resolve correctly in production.

## Cursor Cloud Agents

This repository is the origin for Cursor Cloud Agents. `.cursor/environment.json` installs dependencies with `npm ci` and starts the Next.js dev server on port 3000.

Start a Cloud Agent from [github.com/rhrits/github-contribution-wrap](https://github.com/rhrits/github-contribution-wrap).
