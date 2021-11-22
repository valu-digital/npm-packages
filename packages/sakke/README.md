# sakke npm package

Small wrapper for Webpack, Babel and various Webpack loaders for Valu Digital
Sakke projects.

Features

-   JavaScript / TypeScript / JSX Transpiling
-   CSS importing
-   SVG importing
-   Build-in Webpack Dev Server with https
-   Automatically reads `sakke.json`
-   Automatically loads entry points from `assets/scripts`
-   Output is written to `dist/scripts` with a `manifest.json` file
-   jQuery imports are aliased to the global jQuery
-   Ability analyze the js bundle contents

## Install

```
npm install sakke
```

## HTTPS

This tool uses https and you must point SAKKE_CA, SAKKE_CERT and SAKKE_KEY
environment variables to localhost certificate.

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

### Dev mode

Run Wepback Dev Server, SASS watcher, live reload etc.

```
sakke dev
```

### Build For Production

```
sakke build
```

## Deploy

To production

```
sakke deploy-production
```

Staging

```
sakke deploy-staging
```

### JS

JS specific tasks

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

### CSS

Build CSS from SASS

```
sakke css
```

### Legacy Gulp task

Run any legacy gulp task with

```
sakke gulp [task name]
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

Remove the wepback config package and other build packages

```
npm uninstall @valu/webpack-config @epeli/webpack-config cssnano gulp gulp-cssnano gulp-imagemin gulp-livereload gulp-postcss gulp-sass imagemin-pngcrush autoprefixer terser find-process
```

Install the new package and refresh the lock file

```
npm install sakke
rm -rf node_modules package-json.lock
npm install
```

Remove gulpfile(s)

```
rm -f gulpfile.js sakke-lib/gulpfile.js
```

Remove old jquery proxy

```
rm assets/scripts/lib/jquery.js
```

Other old crap too if present

```
rm -rf sakke-lib/tools sakke-lib/package*
```

Create `sakke.config.js` and copy `babelPlugins`, `webpackPlugins` and
`compileNodeModules`, `webpackRules` fields from `webpack.config.js` if
applicable.

Remove `webpack.config.js`

```
rm webpack.config.js
```
