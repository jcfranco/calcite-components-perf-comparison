import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const latestPackage = resolve(".benchmark/latest/node_modules/@esri/calcite-components/package.json");
const nextPackage = resolve(".benchmark/next/node_modules/@esri/calcite-components/package.json");
const target = process.argv[2] ?? "local";

if (target !== "local" && target !== "next") {
  console.error('Usage: npm run compare -- [local|next]');
  process.exit(1);
}

function ensurePackage(packagePath, setupScript, description) {
  if (!existsSync(packagePath)) {
    console.log(`Installing ${description}...`);
    const setup = spawnSync("npm", ["run", setupScript], { stdio: "inherit" });

    if (setup.status !== 0) {
      process.exit(setup.status ?? 1);
    }
  }
}

ensurePackage(latestPackage, "setup:latest", "the latest published Calcite build");

if (target === "next") {
  ensurePackage(nextPackage, "setup:next", "the next Calcite build");
}

const vite = resolve("node_modules/vite/bin/vite.js");
const servers = [
  startServer("latest", "4173", target),
  startServer(target, "4174", target)
];

function startServer(build, port, compareTarget) {
  return spawn(
    process.execPath,
    [vite, "--host", "127.0.0.1", "--port", port, "--strictPort"],
    {
      env: {
        ...process.env,
        CALCITE_BUILD: build,
        CALCITE_COMPARE_TARGET: compareTarget
      },
      stdio: "inherit"
    }
  );
}

function stopServers(signal = "SIGTERM") {
  for (const server of servers) {
    if (!server.killed) {
      server.kill(signal);
    }
  }
}

for (const server of servers) {
  server.on("exit", (code) => {
    if (code && code !== 0) {
      stopServers();
      process.exitCode = code;
    }
  });
}

process.on("SIGINT", () => {
  stopServers("SIGINT");
  process.exit(130);
});
process.on("SIGTERM", () => {
  stopServers();
  process.exit(143);
});

console.log(`\nComparison dashboard (latest + ${target}): http://127.0.0.1:4173/compare.html\n`);
