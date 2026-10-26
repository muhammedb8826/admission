const isDev = process.env.NODE_ENV !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "admission-api.dadu.edu.et",
        pathname: "/uploads/**",
      },
    ],
    // allow local Strapi assets during development
    unoptimized: isDev,
  },
};

export default nextConfig;
