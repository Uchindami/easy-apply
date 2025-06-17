import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  ssr: {
    noExternal: ["posthog-js", "posthog-js/react"],
  },
  // server: {
  //   proxy: {
  //     "/api": {
  //       target: "http://localhost:8080",
  //       changeOrigin: true, 
  //       rewrite: (path) => path.replace(/^\/api/, "/"),
  //     },
  //   },
  // },
});
// This Vite configuration sets up a React project with Tailwind CSS and TypeScript support.
