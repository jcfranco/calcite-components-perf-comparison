# Calcite table performance benchmark

Vanilla JavaScript benchmark for comparing the latest published
`@esri/calcite-components` package with a local build linked through npm. Each
build runs in a separate Vite server and iframe so the two versions never
register the same custom elements in one browser realm.

## Compare latest with a local build

From the local Calcite Components repository, build the package and create its
global npm link. Then link it into this repository:

```sh
npm install
npm link @esri/calcite-components
npm run compare
```

Open <http://127.0.0.1:4173/compare.html>. The first comparison run installs
the current npm release into the ignored `.benchmark/latest` directory without
changing the linked local package.

The dashboard runs warmups followed by repeated samples, one build at a time.
It reports median and p95 timings for DOM creation, custom-element readiness,
and readiness plus two animation frames. Use **Copy JSON** to retain the raw
samples, browser version, execution order, and package versions.

Run `npm run setup:latest` again whenever the published `latest` version
changes. For profiling a single build, use `npm run start:latest` or
`npm run start:local` and open `/tables.html`.

For less noisy results, close DevTools and unrelated tabs, keep the browser
window and benchmark runners visible, disable CPU throttling, and compare
several complete runs.
