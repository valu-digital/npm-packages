# Epeli's Webpack configuration

[![Greenkeeper badge](https://badges.greenkeeper.io/epeli/webpack-config.svg)](https://greenkeeper.io/)

I love the idea of React Create App but I've never been able to use it due to
lack of its customization possibilities but I've never had too much trouble
configuring Webpack neighter. It's just a lots of stuff to remember and I'm
lazy.

So instead of writing some personal notes I've created this tiny tool which
generates Webpack (and Babel) configuration. It's my "personal React Create
App" if you will.

# Usage

    npm install @epeli/webpack-config

and in `webpack.config.js`

```js
const {createWebpackConfig} = require("@epeli/webpack-config");
module.exports = createWebpackConfig();
```

# Defaults

By default it reads an entry point from `./src/index`. The index file can be
`index.js`,`index.jsx`,`index.ts`, or `index.tsx`. Production bundle is
written to `./dist/main.js`.

The default Babel configuration has `react`, `typescript` and `env` presets.

It also adds the class properties and dynamic import proposal plugins and
Emotion plugin with source maps.

Enables `.mjs` based tree shaking for some npm modules (ex. react-icons).

In development when using `--hot` with the `webpack-dev-server` React Hot
Loader Babel plugin is activated automatically.

# Options

You can configure the configuration. Yeah known! But I think it's actually a
good thing because now this tool that I know well abstracts mostly Webpack
from my projects. Which means that if Webpack changes its configuration
syntax or adds a feature I want to enable in my projects I can just adjust
this tool and update my project deps of this.

## `entry: mixed`

This option is passed directly to the Wepback entry option.

## `babelEnv: mixed`

This option is passed directly to `@babel/preset-env` options

## `extractCommons: boolean`

If you have added multiple entry points using the `entry` option
you can set this to `true` to enable creation of an additional
bundle which includes all the common code between the entry points.

It will be written to `./dist/commons.js`.

## `hashFilenames: boolean`

Add a hash to the generated bundle filenames.

## `hotCors: boolean`

If you are using React Hot Loader this options makes it work cross domains by
adding the required CORS headers. Ex. you can run your webserver from a
virtual server / container / remote server / whatever and serve hot
javascript bundles from localhost.

## `historyApiFallback: boolean | mixed`

Enable history fallback if you want to use React Router with the HTML 5
History API. This is passed directly to
[devServer.historyApiFallback](https://webpack.js.org/configuration/dev-server/#devserver-historyapifallback)

## `babelPlugins: (string | [string, any] | Function)[]`

List of custom babel plugins to enable.

You can also pass a function which is called with `{mode: "production" | "development"}` which allows different configurations for production and
development.

Ex.

```js
module.exports = createWebpackConfig({
    babelPlugins: [
        args => {
            if (args.mode === "production") {
                return "emotion";
            }

            return [
                "emotion",
                {
                    sourceMap: true,
                    autoLabel: true,
                    labelFormat: "[filename]--[local]",
                },
            ];
        },
    ],
});
```

## `template: string`

This is the most custom part of this lib. It takes a path to a template file
which is processed with [Lodash
templates](https://lodash.com/docs/4.17.10#template). The end result is
written to `./dist`.

Inside the template following functions are available:

-   `renderHash(chunkName)` render content hash of the chunk
-   `renderScriptTag(chunkName)` render script tag for chunk
-   `renderHashedChunk(chunkName)` render chunk name with hash query (ex. `main.js?v=1234`)

The `chunkName` can be the entry name (ex. `main`) or the extracted bundle
name `commons`.

# CSS

CSS files can be imported using the ES import syntax.

# Babel customization

You can customize the env-preset with [`.browserlistrc`
file](https://github.com/browserslist/browserslist).

When required you can completely customize the Babel configuration by
creating your own `babel.config.js`, `.babelrc.js` or `.baberc` file.

`process.env.NODE_ENV` is exposed to Javascript based Babel config files
based on the Webpack `--mode` argument.

# Full customization

The full generated Webpack configuration can be customized with the
customizer callback:

```js
module.exports = createWebpackConfig(options, config => {
    config.entry.myExtraEntry = "./src/other.js";
});
```

# Webpack Bundle Analyzer

Can be activated with an `ANALYZE` environment variable

    ANALYZE=1 webpack --mode production
