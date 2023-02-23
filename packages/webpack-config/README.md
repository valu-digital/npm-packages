DEPRECRATED

Use the sakke package https://github.com/valu-digital/npm-packages/tree/master/packages/sakke

# Valu Webpack Config Generator

Webpack config generation with build-in Babel, CSS and template support.

# Usage

    npm install @valu/webpack-config

and in `webpack.config.js`

```js
const {createWebpackConfig} = require("@valu/webpack-config");
module.exports = createWebpackConfig();
```

# Defaults

By default it reads an entry point from `./src/index`. The index file can be
`index.js`,`index.jsx`,`index.ts`, or `index.tsx`. Production bundle is
written to `./dist/main.js`.

The default Babel configuration has `react`, `typescript` and `env` presets.

It also adds the class properties and dynamic import proposal plugins.

Enables `.mjs` based tree shaking for some npm modules (ex. react-icons).

In development when using `--hot` with the `webpack-dev-server` React Hot
Loader Babel plugin is activated automatically.

# Options

You can configure the configuration. Yeah known!

## `entry: mixed`

This option is passed directly to the Wepback entry option.

## `babelEnv: mixed`

This option is passed directly to `@babel/preset-env` options

## `maxChunks: number`

Add LimitChunkCountPlugin with given maxChunks value

https://webpack.js.org/plugins/limit-chunk-count-plugin/

## `env: {} | string[]`

And EnvironmentPlugin with given options.

https://webpack.js.org/plugins/environment-plugin/

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

## `compileNodeModules: string[]`

List node_modules to compile with Babel. By default files in `node_module` is
assumed to be in ES5.

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
        (args) => {
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

## `webpackPlugins: any[]`

List of custom Webpack plugins to enable.

Ex.

```js
module.exports = createWebpackConfig({
    webpackPlugins: [
        new webpack.DefinePlugin({
            CHANGE_ME_WITH_DEFINE_PLUGIN: JSON.stringify(
                "CHANGED_WITH_DEFINE_PLUGIN"
            ),
        }),
    ],
});
```

## `webpackRules: any[]`

Add custom Webpack rules AKA Loaders. These will be executed before the
build-in Babel loader.

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

For advanced use cases you can provide `customizeBabelOptions()` function to
`createWebpackConfig()` for more fine grained dynamic customization. The
`customizeBabelOptions()` will get object object of following interface:

```ts
interface CustomizeParam {
    /**
     * The babel plugin and preset configuration generated by @valu/webpack-config
     */
    options: BabelOptions;

    /**
     * Babel options read from .babelrc, babel.config.js etc.
     */
    babelrcOptions: BabelOptions;

    /*
     * Is true when babel config was read from the filesystem
     */
    hasFilesystemConfig: boolean;

    /*
     * Full path to the babel config file (if any)
     */
    babelrc: string;

    /**
     * Current file beign transpiled
     */
    filename: string;
}
```

If you return an object from this function it will be used as the babel
config for the given file. If falsy value is returned no changes are made.

Example

```js
module.exports = createWebpackConfig({
    outputPath: __dirname + "/test-app",
    entry: __dirname + "/test-app/index.ts",
    customizeBabelOptions(babel) {
        // Force my-extra-plugin to be present when custom .babelrc file is used
        if (babel.hasFilesystemConfig) {
            babel.babelrcOptions.plugins.push("my-extra-plugin");
            return babel.babelrcOptions;
        }

        return babel.options;
    },
});
```

# Full customization

The full generated Webpack configuration can be customized with the
customizer callback:

```js
module.exports = createWebpackConfig(options, (config) => {
    config.entry.myExtraEntry = "./src/other.js";
});
```

# Webpack Bundle Analyzer

Can be activated with an `ANALYZE` environment variable

    ANALYZE=1 webpack --mode production
