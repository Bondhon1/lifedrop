import { MetadataRoute } from "next";

// Keep robots generation deterministic and safe in production by
// avoiding runtime header access that can fail in certain server
// environments. Prefer an explicit env var, otherwise fall back to
// the canonical site URL.
function resolveBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://www.lifedrop.live"
  ).replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/profile/",
          "/chat/",
          "/notifications/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
