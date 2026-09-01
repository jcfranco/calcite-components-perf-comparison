import "@esri/calcite-components/components/calcite-autocomplete";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-input";
import "@esri/calcite-components/components/calcite-input-number";
import "@esri/calcite-components/components/calcite-input-text";
import "@esri/calcite-components/components/calcite-menu";
import "@esri/calcite-components/components/calcite-text-area";
import "@esri/calcite-components/main.css";
import "./styles.css";
import "./components.css";

const COMPONENT_COUNT = 50_000;
const COMPONENTS = [
  {
    tagName: "calcite-input",
    configure(element) {
      element.clearable = true;
      element.labelText = "Input";
      element.placeholder = "Enter a value";
      element.scale = "m";
    }
  },
  {
    tagName: "calcite-input-text",
    configure(element) {
      element.clearable = true;
      element.labelText = "Text input";
      element.placeholder = "Enter text";
      element.scale = "m";
    }
  },
  {
    tagName: "calcite-input-number",
    configure(element) {
      element.labelText = "Number input";
      element.max = 100;
      element.min = 0;
      element.scale = "m";
      element.step = 1;
      element.value = "50";
    }
  },
  {
    tagName: "calcite-menu",
    configure(element) {
      element.label = "Navigation";
      element.layout = "horizontal";
      element.scale = "m";
    }
  },
  {
    tagName: "calcite-button",
    configure(element) {
      element.appearance = "solid";
      element.kind = "brand";
      element.scale = "m";
      element.textContent = "Button";
    }
  },
  {
    tagName: "calcite-autocomplete",
    configure(element) {
      element.labelText = "Autocomplete";
      element.placeholder = "Search";
      element.scale = "m";
    }
  },
  {
    tagName: "calcite-text-area",
    configure(element) {
      element.labelText = "Text area";
      element.placeholder = "Enter text";
      element.resize = "vertical";
      element.rows = 3;
      element.scale = "m";
    }
  }
];

const componentSelect = document.querySelector("#component-select");
const container = document.querySelector("#component-container");
const renderButton = document.querySelector("#render-components");
const status = document.querySelector("#status");

for (const component of COMPONENTS) {
  const option = document.createElement("option");

  option.value = component.tagName;
  option.textContent = component.tagName.replace("calcite-", "");
  componentSelect.append(option);
}

componentSelect.value = "calcite-button";
renderButton.addEventListener("click", renderComponents);

function renderComponents() {
  const component = COMPONENTS.find(({ tagName }) => tagName === componentSelect.value);

  container.replaceChildren();
  status.textContent =
    `Rendering ${COMPONENT_COUNT.toLocaleString()} ${component.tagName} elements...`;

  requestAnimationFrame(() => {
    const start = performance.now();

    for (let index = 0; index < COMPONENT_COUNT; index++) {
      const element = document.createElement(component.tagName);

      component.configure(element);
      container.append(element);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const duration = performance.now() - start;

        status.textContent =
          `${COMPONENT_COUNT.toLocaleString()} ${component.tagName} elements rendered in ` +
          `${duration.toFixed(1)} ms (measured through two animation frames).`;
      });
    });
  });
}
