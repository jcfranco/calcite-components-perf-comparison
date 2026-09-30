import { defineConfig } from "vite";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

export default defineConfig(() => {
  const buildName = process.env.CALCITE_BUILD || "local";
  const compareTarget = process.env.CALCITE_COMPARE_TARGET || "local";
  const packageRoots = {
    latest: resolve(".benchmark/latest/node_modules/@esri/calcite-components"),
    local: resolve("node_modules/@esri/calcite-components"),
    next: resolve(".benchmark/next/node_modules/@esri/calcite-components")
  };
  const packageRoot = packageRoots[buildName];

  if (!packageRoot) {
    throw new Error(`Unknown Calcite build "${buildName}". Use "local", "latest", or "next".`);
  }

  if (compareTarget !== "local" && compareTarget !== "next") {
    throw new Error(`Unknown comparison target "${compareTarget}". Use "local" or "next".`);
  }

  const packageJsonPath = resolve(packageRoot, "package.json");

  if (!existsSync(packageJsonPath)) {
    throw new Error(
      buildName === "latest"
        ? 'Latest Calcite is not installed. Run "npm run setup:latest" first.'
        : buildName === "next"
          ? 'Next Calcite is not installed. Run "npm run setup:next" first.'
          : 'Calcite is not installed or linked. Run "npm install" or "npm link @esri/calcite-components".'
    );
  }

  const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const resolveFromCalcite = createRequire(packageJsonPath).resolve;

  return {
    define: {
      __CALCITE_BUILD__: JSON.stringify(buildName),
      __CALCITE_COMPARE_TARGET__: JSON.stringify(compareTarget),
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
