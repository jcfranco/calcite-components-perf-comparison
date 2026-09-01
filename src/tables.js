import "@esri/calcite-components/components/calcite-table";
import "@esri/calcite-components/components/calcite-table-cell";
import "@esri/calcite-components/components/calcite-table-header";
import "@esri/calcite-components/components/calcite-table-row";
import "@esri/calcite-components/main.css";
import "./styles.css";

const ROW_COUNT = 1_200;
const COLUMN_NAMES = ["Address ID", "Address", "Unit", "Node Name", "Detail"];
const STREETS = [
  "Kifer Road",
  "Market Street",
  "Mission Street",
  "Howard Street",
  "Van Ness Avenue",
  "Embarcadero"
];

const rows = createRows();
const container = document.querySelector("#table-container");
const status = document.querySelector("#status");
const nativeButton = document.querySelector("#render-native");
const calciteButton = document.querySelector("#render-calcite");

nativeButton.addEventListener("click", () => renderTable("native"));
calciteButton.addEventListener("click", () => renderTable("calcite"));

// const Button = customElements.get("calcite-button");
// const originalSetTooltipText = Button.prototype.setTooltipText;
// Button.prototype.setTooltipText = function () { console.log ("blocked boy!") };

function createRows() {
  return Array.from({ length: ROW_COUNT }, (_, index) => {
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

function renderTable(kind) {
  container.replaceChildren();
  setActiveButton(kind);
  status.textContent = `Rendering ${kind === "native" ? "native HTML" : "Calcite"} table...`;

  requestAnimationFrame(() => {
    const start = performance.now();
    const table = kind === "native" ? createNativeTable() : createCalciteTable();

    container.append(table);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const duration = performance.now() - start;
        status.textContent =
          `${kind === "native" ? "Native HTML table" : "Calcite table"}: ` +
          `${ROW_COUNT.toLocaleString()} rows rendered in ${duration.toFixed(1)} ms ` +
          "(measured through two animation frames).";
      });
    });
  });
}

function createNativeTable() {
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

function createCalciteTable() {
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
  const button = document.createElement("calcite-button");

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
