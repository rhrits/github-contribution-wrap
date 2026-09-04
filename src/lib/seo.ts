function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "WRAP.";
export const SITE_TITLE = "WRAP. GitHub Contribution Wrap";
export const SITE_DESCRIPTION =
  "Turn any GitHub contribution calendar into a forest heatmap, harbor fleet, skyline, commit current, or a 3D Bengaluru traffic map. Download a wrap image, unlock awards, and share the voyage. Built in India by Hritik Raj (@rhrits).";

export const GEO = {
  region: "IN",
  country: "India",
  placename: "India",
  latitude: 20.5937,
  longitude: 78.9629,
  position: "20.5937;78.9629",
  icbm: "20.5937, 78.9629",
  locale: "en_IN",
  language: "en-IN",
} as const;

export const AUTHOR = {
  name: "Hritik Raj",
  handle: "rhrits",
  url: "https://github.com/rhrits",
  sameAs: ["https://github.com/rhrits", "https://x.com/rhrits"],
} as const;

export function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        alternateName: "GitHub Contribution Wrap",
        url: SITE_URL,
        image: new URL("/og.png", SITE_URL).toString(),
        logo: new URL("/logo.svg", SITE_URL).toString(),
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        description: SITE_DESCRIPTION,
        inLanguage: ["en", "en-IN"],
        countryOfOrigin: { "@type": "Country", name: GEO.country },
        spatialCoverage: {
          "@type": "Place",
          name: GEO.country,
          geo: {
            "@type": "GeoCoordinates",
            latitude: GEO.latitude,
            longitude: GEO.longitude,
            addressCountry: GEO.region,
          },
        },
        author: {
          "@type": "Person",
          name: AUTHOR.name,
          url: AUTHOR.url,
          sameAs: AUTHOR.sameAs,
          nationality: "Indian",
        },
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      },
      {
        "@type": "Person",
        name: AUTHOR.name,
        url: AUTHOR.url,
        nationality: "Indian",
        homeLocation: {
          "@type": "Place",
          name: GEO.country,
          geo: {
            "@type": "GeoCoordinates",
            latitude: GEO.latitude,
            longitude: GEO.longitude,
          },
        },
        sameAs: AUTHOR.sameAs,
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: GEO.language,
        publisher: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
      },
    ],
  };
}
