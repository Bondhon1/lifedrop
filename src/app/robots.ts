import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://lifedrop-alpha.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/_next/",
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
