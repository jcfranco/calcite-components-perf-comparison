import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const latestPackage = resolve(".benchmark/latest/node_modules/@esri/calcite-components/package.json");

if (!existsSync(latestPackage)) {
  console.log("Installing the latest published Calcite build...");
  const setup = spawnSync("npm", ["run", "setup:latest"], { stdio: "inherit" });

  if (setup.status !== 0) {
    process.exit(setup.status ?? 1);
  }
}

const vite = resolve("node_modules/vite/bin/vite.js");
const servers = [
  startServer("latest", "4173"),
  startServer("local", "4174")
];

function startServer(build, port) {
  return spawn(
    process.execPath,
    [vite, "--host", "127.0.0.1", "--port", port, "--strictPort"],
    {
      env: { ...process.env, CALCITE_BUILD: build },
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

console.log("\nComparison dashboard: http://127.0.0.1:4173/compare.html\n");
