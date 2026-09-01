import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    preserveSymlinks: false
  },
  build: {
    rollupOptions: {
      input: {
        buttons: "index.html",
        tables: "tables.html",
        components: "components.html"
      }
    }
  }
});
