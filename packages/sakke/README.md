# sakke npm package

Small wrapper for Webpack, Babel and various Webpack loaders for Valu Digital
Sakke projects.

Features

-   JavaScript / TypeScript / JSX Transpiling
-   CSS importing
-   SVG importing
-   Build-in Webpack Dev Server
-   Automatically reads `sakke.json`
-   Automatically loads entry points from `assets/scripts`
-   Output is written to `dist/scripts` with a `manifest.json` file
-   jQuery imports are aliased to the global jQuery

## Install

```
npm install sakke
```

## Config

Create `sakke.config.js`:

```js
/** @type {import("sakke").Config} */
const config = {
    // babelPlugins: [],
    // webpackPlugins: [],
    // webpackRules: [],
    // compileNodeModules: [],
};

module.exports = config;
```

The type comment is just to help the editor autocomplete.

## CLI Usage

Build for production

```
sakke js --production
```

Develop with the dev server

```
sakke js --serve
```

Analyze bundle contents

```
sakke js --analyze
```

## Importing Webpack

If you need to customize the Webpack plugins you must import it from
`sakke/webpack` to ensure correct version is used.

Example

```js
const webpack = require("sakke/webpack");

/** @type {import("sakke").Config} */
const config = {
    webpackPlugins: [
        new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /fi|en/),
    ],
};

module.exports = config;
```

## Migrating from `@valu/webpack-config`

Remove the wepback config package

```
npm uninstall @valu/webpack-config # or possibly @epeli/webpack-config
```

Install the new package and refresh the lock file

```
npm install sakke
rm -rf node_modules package-json.lock
npm install
```

Remove old jquery proxy

```
rm assets/scripts/lib/jquery.js
```

Create `sakke.config.js` and copy `babelPlugins`, `webpackPlugins` and
`compileNodeModules`, `webpackRules` fields from `webpack.config.js` if
applicable.

Remove `webpack.config.js`

```
rm webpack.config.js
```
