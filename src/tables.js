import "@esri/calcite-components/components/calcite-table";
import "@esri/calcite-components/components/calcite-table-cell";
import "@esri/calcite-components/components/calcite-table-header";
import "@esri/calcite-components/components/calcite-table-row";
import "@esri/calcite-components/main.css";
import "./styles.css";

const DEFAULT_ROW_COUNT = 1_200;
const COLUMN_NAMES = ["Address ID", "Address", "Unit", "Node Name", "Detail"];
const STREETS = [
  "Kifer Road",
  "Market Street",
  "Mission Street",
  "Howard Street",
  "Van Ness Avenue",
  "Embarcadero"
];

const container = document.querySelector("#table-container");
const status = document.querySelector("#status");
const nativeButton = document.querySelector("#render-native");
const calciteButton = document.querySelector("#render-calcite");
const buildHeading = document.querySelector("#build-heading");
const buildDescription = document.querySelector("#build-description");
const runnerMode = new URLSearchParams(location.search).has("runner");

buildHeading.textContent = `${__CALCITE_BUILD__} Calcite ${__CALCITE_VERSION__}`;
buildDescription.textContent =
  `Render ${DEFAULT_ROW_COUNT.toLocaleString()} rows and five columns using this isolated build.`;

// const Button = customElements.get("calcite-button");
// const originalSetTooltipText = Button.prototype.setTooltipText;
// Button.prototype.setTooltipText = function () { console.log ("blocked boy!") };

nativeButton.addEventListener("click", () => renderTable("native", DEFAULT_ROW_COUNT));
calciteButton.addEventListener("click", () => renderTable("calcite", DEFAULT_ROW_COUNT));

if (runnerMode) {
  window.addEventListener("message", handleBenchmarkMessage);
  window.parent.postMessage(
    {
      type: "calcite-benchmark-ready",
      build: { name: __CALCITE_BUILD__, version: __CALCITE_VERSION__ }
    },
    "*"
  );
}

function createRows(rowCount) {
  return Array.from({ length: rowCount }, (_, index) => {
    const rowNumber = index + 1;
    const nodeNumber = Math.floor(index / 60) + 1;

    return {
      addressId: `ADDR-${rowNumber.toString().padStart(4, "0")}`,
      address: `${100 + (index % 900)} ${STREETS[index % STREETS.length]}, Sample City, CA`,
      unit: `Unit ${(index % 80) + 1}`,
      nodeName: `NODE-${nodeNumber.toString().padStart(3, "0")}`
    };
  });
}

async function renderTable(kind, rowCount) {
  container.replaceChildren();
  setActiveButton(kind);
  status.textContent = `Rendering ${kind === "native" ? "native HTML" : "Calcite"} table...`;

  await nextFrame();
  const rows = createRows(rowCount);
  const start = performance.now();
  const table = kind === "native" ? createNativeTable(rows) : createCalciteTable(rows);

  container.append(table);
  await waitForComponents(table);
  await nextFrame();
  await nextFrame();

  const duration = performance.now() - start;
  status.textContent =
    `${kind === "native" ? "Native HTML table" : "Calcite table"}: ` +
    `${rowCount.toLocaleString()} rows rendered in ${duration.toFixed(1)} ms ` +
    "(components ready plus two animation frames).";
}

function createNativeTable(rows) {
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const body = document.createElement("tbody");

  for (const name of COLUMN_NAMES) {
    const header = document.createElement("th");
    header.scope = "col";
    header.textContent = name;
    headerRow.append(header);
  }

  head.append(headerRow);

  for (const row of rows) {
    const tableRow = document.createElement("tr");
    tableRow.append(
      createNativeCell(row.addressId),
      createNativeCell(row.address),
      createNativeCell(row.unit),
      createNativeCell(row.nodeName),
      createNativeDetailCell()
    );
    body.append(tableRow);
  }

  table.append(head, body);
  return table;
}

function createNativeCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function createNativeDetailCell() {
  const cell = document.createElement("td");
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = "Go to location";
  cell.append(button);
  return cell;
}

function createCalciteTable(rows) {
  const table = document.createElement("calcite-table");
  const headerRow = document.createElement("calcite-table-row");

  table.caption = "Address locations";
  headerRow.slot = "table-header";

  for (const name of COLUMN_NAMES) {
    const header = document.createElement("calcite-table-header");
    header.heading = name;
    headerRow.append(header);
  }

  table.append(headerRow);

  for (const row of rows) {
    const tableRow = document.createElement("calcite-table-row");
    tableRow.append(
      createCalciteCell(row.addressId),
      createCalciteCell(row.address),
      createCalciteCell(row.unit),
      createCalciteCell(row.nodeName),
      createCalciteDetailCell()
    );
    table.append(tableRow);
  }

  return table;
}

function createCalciteCell(value) {
  const cell = document.createElement("calcite-table-cell");
  cell.textContent = value;
  return cell;
}

function createCalciteDetailCell() {
  const cell = document.createElement("calcite-table-cell");
  const button = document.createElement("button");

  button.appearance = "outline";
  button.scale = "s";
  button.type = "button";
  button.textContent = "Go to location";
  cell.append(button);
  return cell;
}

function setActiveButton(kind) {
  nativeButton.classList.toggle("active", kind === "native");
  calciteButton.classList.toggle("active", kind === "calcite");
}

async function handleBenchmarkMessage(event) {
  if (event.source !== window.parent || event.data?.type !== "calcite-benchmark-run") {
    return;
  }

  const { id, options } = event.data;

  try {
    const result = await runBenchmark(options);
    event.source.postMessage({ type: "calcite-benchmark-result", id, result }, event.origin);
  } catch (error) {
    event.source.postMessage(
      { type: "calcite-benchmark-result", id, error: error.message },
      event.origin
    );
  }
}

async function runBenchmark({ rows: rowCount, samples, warmups }) {
  const rows = createRows(rowCount);
  const measurements = [];

  nativeButton.disabled = true;
  calciteButton.disabled = true;

  try {
    for (let index = 0; index < warmups + samples; index++) {
      status.textContent =
        index < warmups
          ? `Warmup ${index + 1} of ${warmups}...`
          : `Sample ${index - warmups + 1} of ${samples}...`;
      const measurement = await measureCalciteTable(rows);

      if (index >= warmups) {
        measurements.push(measurement);
      }
    }
  } finally {
    nativeButton.disabled = false;
    calciteButton.disabled = false;
  }

  status.textContent = `${samples} benchmark samples complete.`;

  return {
    build: { name: __CALCITE_BUILD__, version: __CALCITE_VERSION__ },
    samples: measurements,
    summary: Object.fromEntries(
      ["create", "ready", "paint"].map((metric) => [
        metric,
        summarize(measurements.map((measurement) => measurement[metric]))
      ])
    )
  };
}

async function measureCalciteTable(rows) {
  container.replaceChildren();
  await nextFrame();
  await idle();

  const start = performance.now();
  const table = createCalciteTable(rows);
  const created = performance.now();

  container.append(table);
  await waitForComponents(table);
  const ready = performance.now();
  await nextFrame();
  await nextFrame();
  const painted = performance.now();

  return {
    create: created - start,
    ready: ready - start,
    paint: painted - start
  };
}

async function waitForComponents(root) {
  const components = [root, ...root.querySelectorAll("*")].filter(
    (element) => typeof element.componentOnReady === "function"
  );

  await Promise.all(components.map((element) => element.componentOnReady()));
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);

  return {
    min: sorted[0],
    median: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    max: sorted.at(-1)
  };
}

function percentile(sorted, percentileValue) {
  const index = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(index);
  const fraction = index - lower;

  return sorted[lower] + (sorted[lower + 1] - sorted[lower] || 0) * fraction;
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function idle() {
  return new Promise((resolve) => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(resolve, { timeout: 100 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}
