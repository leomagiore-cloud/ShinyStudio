import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "logo.jpg"],
      manifest: {
        name: "Shiny Studio",
        short_name: "Shiny",
        description: "Gestão para estúdios de detailing",
        theme_color: "#e11d48",
        background_color: "#0a0a0b",
        display: "standalone",
        start_url: "/dashboard",
        lang: "pt-BR",
        icons: [
          {
            src: "/logo.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "/logo.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: "/",
        globPatterns: ["**/*.{js,css,html,ico,jpg,png,svg,woff2}"],
      },
    }),
  ],
  nitro: {
    preset: "netlify",
  },
});