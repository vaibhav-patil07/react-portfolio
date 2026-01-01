import * as path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rollupReplace from "@rollup/plugin-replace";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    rollupReplace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...(process.env.USE_SOURCE
        ? {
            "react-router": path.resolve(
              __dirname,
              "../../packages/react-router/index.ts"
            ),
            "react-router-dom": path.resolve(
              __dirname,
              "../../packages/react-router-dom/index.tsx"
            ),
          }
        : {}),
    },
  },
});
