import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Used by `npm run dev` only. `vercel dev` routes /api to the backend service.
      "/api": "http://localhost:5000",
    },
  },
});
