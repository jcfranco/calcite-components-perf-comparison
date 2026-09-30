# Calcite table performance benchmark

Vanilla JavaScript benchmark for comparing the latest published
`@esri/calcite-components` package with either a local build linked through npm
or the npm `next` release. Each build runs in a separate Vite server and iframe
so the two versions never register the same custom elements in one browser realm.

## Compare latest with local or next

By default, comparison runs latest against a local build linked through npm.
From the local Calcite Components repository, build the package and create its
global npm link, then run:

```sh
npm install
npm link @esri/calcite-components
npm run compare
```

To compare the two npm releases instead, run:

```sh
npm run compare -- next
```

Open <http://127.0.0.1:4173/compare.html>. The first run installs the required
release(s) into ignored `.benchmark/latest` and `.benchmark/next` directories.
The `next` option uses the npm `next` dist-tag and does not require a local npm
link.

The dashboard runs warmups followed by repeated samples, one build at a time.
It reports median and p95 timings for DOM creation, custom-element readiness,
and readiness plus two animation frames. Use **Copy JSON** to retain the raw
samples, browser version, execution order, and package versions.

Run `npm run setup:latest` or `npm run setup:next` again whenever the matching
published version changes. For profiling a single build, use
`npm run start:latest`, `npm run start:local`, or `npm run start:next` and open
`/tables.html`.

For less noisy results, close DevTools and unrelated tabs, keep the browser
window and benchmark runners visible, disable CPU throttling, and compare
several complete runs.
