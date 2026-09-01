import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/main.css";
import "./styles.css";
import "./buttons.css";

const BUTTON_COUNT = 2_000;

const container = document.querySelector("#button-container");
const status = document.querySelector("#status");
const nativeButton = document.querySelector("#render-native");
const calciteButton = document.querySelector("#render-calcite");

nativeButton.addEventListener("click", () => renderButtons("native"));
calciteButton.addEventListener("click", () => renderButtons("calcite"));

function renderButtons(kind) {
  container.replaceChildren();
  setActiveButton(kind);
  status.textContent =
    `Rendering ${kind === "native" ? "native HTML" : "Calcite"} buttons...`;

  requestAnimationFrame(() => {
    const start = performance.now();
    const buttons = createButtons(kind);

    container.append(buttons);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const duration = performance.now() - start;
        status.textContent =
          `${kind === "native" ? "Native HTML buttons" : "Calcite buttons"}: ` +
          `${BUTTON_COUNT.toLocaleString()} buttons rendered in ${duration.toFixed(1)} ms ` +
          "(measured through two animation frames).";
      });
    });
  });
}

function createButtons(kind) {
  const fragment = document.createDocumentFragment();
  const tagName = kind === "native" ? "button" : "calcite-button";

  for (let index = 0; index < BUTTON_COUNT; index++) {
    const button = document.createElement(tagName);

    button.type = "button";
    button.textContent = `Button ${(index + 1).toLocaleString()}`;

    if (kind === "calcite") {
      button.appearance = "outline";
      button.scale = "s";
    }

    fragment.append(button);
  }

  return fragment;
}

function setActiveButton(kind) {
  nativeButton.classList.toggle("active", kind === "native");
  calciteButton.classList.toggle("active", kind === "calcite");
}
