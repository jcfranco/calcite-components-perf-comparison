import { defineConfig } from "vite";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

export default defineConfig(() => {
  const buildName = process.env.CALCITE_BUILD || "local";
  const packageRoot =
    buildName === "latest"
      ? resolve(".benchmark/latest/node_modules/@esri/calcite-components")
      : resolve("node_modules/@esri/calcite-components");
  const packageJsonPath = resolve(packageRoot, "package.json");

  if (!existsSync(packageJsonPath)) {
    throw new Error(
      buildName === "latest"
        ? 'Latest Calcite is not installed. Run "npm run setup:latest" first.'
        : 'Calcite is not installed or linked. Run "npm install" or "npm link @esri/calcite-components".'
    );
  }

  const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const resolveFromCalcite = createRequire(packageJsonPath).resolve;

  return {
    define: {
      __CALCITE_BUILD__: JSON.stringify(buildName),
      __CALCITE_VERSION__: JSON.stringify(version)
    },
    plugins: [
      {
        name: "resolve-selected-calcite-build",
        enforce: "pre",
        resolveId(source) {
          if (source === "@esri/calcite-components" || source.startsWith("@esri/calcite-components/")) {
            return resolveFromCalcite(source);
          }
        }
      }
    ],
    resolve: { preserveSymlinks: false },
    build: {
      rollupOptions: {
        input: {
          buttons: "index.html",
          compare: "compare.html",
          tables: "tables.html",
          components: "components.html"
        }
      }
    }
  };
});
