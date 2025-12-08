const isDev = process.env.NODE_ENV !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "alumni-api.qenenia.com",
        pathname: "/uploads/**",
      },
    ],
    // allow local Strapi assets during development
    unoptimized: isDev,
  },
};

export default nextConfig;
