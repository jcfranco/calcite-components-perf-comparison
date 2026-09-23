import "@esri/calcite-components/main.css";
import "./styles.css";
import "./compare.css";

const RUNNERS = {
  latest: {
    frame: document.querySelector("#latest-runner"),
    origin: "http://127.0.0.1:4173",
    ready: false
  },
  local: {
    frame: document.querySelector("#local-runner"),
    origin: "http://127.0.0.1:4174",
    ready: false
  }
};

const rowCountInput = document.querySelector("#row-count");
const sampleCountInput = document.querySelector("#sample-count");
const warmupCountInput = document.querySelector("#warmup-count");
const runButton = document.querySelector("#run-comparison");
const copyButton = document.querySelector("#copy-results");
const status = document.querySelector("#status");
const summary = document.querySelector("#result-summary");
const runnerPanel = document.querySelector("details");
let lastReport;
let requestId = 0;

window.addEventListener("message", handleRunnerMessage);
runButton.addEventListener("click", runComparison);
copyButton.addEventListener("click", copyResults);

for (const [name, runner] of Object.entries(RUNNERS)) {
  runner.frame.src = `${runner.origin}/tables.html?runner=${name}`;
}

function handleRunnerMessage(event) {
  const entry = Object.entries(RUNNERS).find(
    ([, runner]) => runner.origin === event.origin && runner.frame.contentWindow === event.source
  );

  if (!entry || event.data?.type !== "calcite-benchmark-ready") {
    return;
  }

  const [name, runner] = entry;
  runner.ready = true;
  runner.build = event.data.build;

  if (Object.values(RUNNERS).every(({ ready }) => ready)) {
    runButton.disabled = false;
    runButton.textContent = "Run comparison";
    status.textContent =
      `Ready: latest ${RUNNERS.latest.build.version} and local ${RUNNERS.local.build.version}.`;
  } else {
    status.textContent = `${name} runner ready; waiting for the other build...`;
  }
}

async function runComparison() {
  const options = {
    rows: clampInput(rowCountInput),
    samples: clampInput(sampleCountInput),
    warmups: clampInput(warmupCountInput)
  };
  const order = Math.random() < 0.5 ? ["latest", "local"] : ["local", "latest"];
  const results = {};

  runnerPanel.open = true;
  setRunning(true);

  try {
    for (const name of order) {
      status.textContent = `Running ${name} build...`;
      results[name] = await runInFrame(name, options);
    }

    lastReport = {
      generatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      options,
      executionOrder: order,
      results
    };
    renderResults(lastReport);
    copyButton.disabled = false;
    status.textContent = "Comparison complete. Lower timings are better.";
  } catch (error) {
    status.textContent = `Benchmark failed: ${error.message}`;
  } finally {
    setRunning(false);
  }
}

function runInFrame(name, options) {
  const runner = RUNNERS[name];
  const id = ++requestId;

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onResult);
      reject(new Error(`${name} runner timed out`));
    }, 120_000);

    function onResult(event) {
      if (
        event.origin !== runner.origin ||
        event.source !== runner.frame.contentWindow ||
        event.data?.id !== id
      ) {
        return;
      }

      if (event.data.type !== "calcite-benchmark-result") {
        return;
      }

      window.clearTimeout(timeout);
      window.removeEventListener("message", onResult);

      if (event.data.error) {
        reject(new Error(`${name}: ${event.data.error}`));
      } else {
        resolve(event.data.result);
      }
    }

    window.addEventListener("message", onResult);
    runner.frame.contentWindow.postMessage(
      { type: "calcite-benchmark-run", id, options },
      runner.origin
    );
  });
}

function renderResults(report) {
  const metrics = [
    ["create", "Create DOM"],
    ["ready", "Components ready"],
    ["paint", "Two-frame total"]
  ];
  const latest = report.results.latest;
  const local = report.results.local;
  const rows = metrics
    .map(([key, label]) => {
      const latestMedian = latest.summary[key].median;
      const localMedian = local.summary[key].median;
      const delta = ((localMedian - latestMedian) / latestMedian) * 100;
      const deltaClass = delta < 0 ? "improvement" : delta > 0 ? "regression" : "";

      return `
        <tr>
          <th scope="row">${label}</th>
          <td>${formatMs(latestMedian)}</td>
          <td>${formatMs(localMedian)}</td>
          <td class="${deltaClass}">${formatDelta(delta)}</td>
          <td>${formatMs(latest.summary[key].p95)} / ${formatMs(local.summary[key].p95)}</td>
        </tr>
      `;
    })
    .join("");

  summary.className = "";
  summary.innerHTML = `
    <div class="build-labels">
      <span><strong>Latest:</strong> ${latest.build.version}</span>
      <span><strong>Local:</strong> ${local.build.version}</span>
      <span>${report.options.rows.toLocaleString()} rows, ${report.options.samples} samples</span>
    </div>
    <div class="table-container result-table">
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Latest median</th>
            <th>Local median</th>
            <th>Local delta</th>
            <th>p95 latest / local</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function copyResults() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(lastReport, null, 2));
    status.textContent = "Raw benchmark report copied as JSON.";
  } catch (error) {
    status.textContent = `Could not copy results: ${error.message}`;
  }
}

function clampInput(input) {
  const value = Number.parseInt(input.value, 10);
  const min = Number.parseInt(input.min, 10);
  const max = Number.parseInt(input.max, 10);
  const clamped = Math.min(Math.max(value, min), max);

  input.value = clamped;
  return clamped;
}

function setRunning(running) {
  runButton.disabled = running;
  copyButton.disabled = running || !lastReport;
  rowCountInput.disabled = running;
  sampleCountInput.disabled = running;
  warmupCountInput.disabled = running;
  runButton.textContent = running ? "Running..." : "Run comparison";
}

function formatMs(value) {
  return `${value.toFixed(1)} ms`;
}

function formatDelta(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
