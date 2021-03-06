// @ts-check
const webpack = require("webpack");
const fs = require("fs");
const {join, resolve} = require("path");
const {execSync} = require("child_process");
const gitRev = execSync("git rev-parse HEAD").toString();
const gitDate = new Date(
    execSync("git log -1 --format=%cd").toString()
).toISOString();
const WebpackAssetsManifest = require("webpack-assets-manifest");

const EXTENSIONS = [".tsx", ".ts", ".mjs", ".jsx", ".js"];

/**
 * @param {string} filename
 */
function removeExtension(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}

/**
 * Generate Webpack entries from the given directory
 *
 * @param {string} dir
 */
function autoloadEntries(dir) {
    const entryFiles = fs
        .readdirSync(dir)
        .filter((fileName) => EXTENSIONS.some((ext) => fileName.endsWith(ext)));

    return entryFiles.reduce((entry, file) => {
        entry[removeExtension(file)] = join(dir, file);
        return entry;
    }, {});
}

/**
 * @param {string} dir
 */
function hasPostCSSConfig(dir) {
    return fs.readdirSync(dir).some((file) => file === "postcss.config.js");
}

function getDefaultConfig() {
    return {
        entry: {
            main: "./src/index",
        },

        optimization: {},

        devtool: "cheap-module-eval-source-map",

        output: {
            // Add hash to the chunk filename by default. This ok since it is
            // automatically loaded by the bundled code eg. we don't manually
            // need to write this anywhere
            chunkFilename: "chunk-[id]-[name]-[chunkhash].js",
            filename: "[name].js",
            path: process.cwd() + "/dist",
        },

        devServer: {
            // With dev server serve files from the dist directory
            contentBase: process.cwd() + "/dist",

            // Workaround for https://github.com/webpack/webpack-dev-server/issues/1604
            disableHostCheck: true,
            // Workaround for multiple issues,
            // e.g. https://github.com/webpack/webpack-dev-server/issues/1021
            host: "127.0.0.1",
        },

        resolve: {
            // The default extensions are quite lame.
            // the .mjs enables tree shaking for some npm modules
            // https://github.com/react-icons/react-icons/issues/154#issuecomment-411036960
            extensions: EXTENSIONS.concat(".json"),
        },

        module: {
            rules: [],
        },

        plugins: [
            new webpack.DefinePlugin({
                WEBPACK_GIT_DATE: JSON.stringify(gitDate),
                WEBPACK_GIT_REV: JSON.stringify(gitRev),
                WEBPACK_BUILD_DATE: JSON.stringify(new Date().toISOString()),
            }),
        ].filter(Boolean),
    };
}

function getBabelLoaderConfig(options = {}) {
    const pathMatchers = (options.compileNodeModules || []).map((include) => {
        return `/node_modules/${include}/`;
    });

    return {
        test: /\.(ts|tsx|js|jsx|mjs)$/,
        resolve: {
            extensions: EXTENSIONS,
        },
        use: {
            loader: resolve(__dirname, "babel-loader.js"),
        },
        exclude(modulePath) {
            const nodeModuleToCompile = pathMatchers.some((includeModule) =>
                modulePath.includes(includeModule)
            );

            if (nodeModuleToCompile) {
                return false;
            }

            return /node_modules/.test(modulePath);
        },
    };
}

/**
 * @param {{extractCss?: boolean, sass?: boolean}} options
 */
function getCssLoaderConfig(options = {}) {
    /** @type any */
    let styleLoader = "style-loader";

    if (options.extractCss) {
        const MiniCssExtractPlugin = require("mini-css-extract-plugin");
        styleLoader = {loader: MiniCssExtractPlugin.loader};
    }

    return {
        test: /\.(css|scss)$/,
        use: [
            styleLoader,

            {
                loader: "css-loader",
                options: {
                    sourceMap: true,
                    url: !options.extractCss,
                },
            },

            options.sass
                ? {
                      loader: "sass-loader",
                      options: {sourceMap: true},
                  }
                : null,

            hasPostCSSConfig(process.cwd())
                ? {
                      loader: "postcss-loader",
                  }
                : null,
        ].filter(Boolean),
    };
}

/**
 *
 * @param {{envConfig?: any} | undefined} options
 */
function getBabelOptions(options) {
    return {
        presets: [
            "@babel/preset-typescript",
            "@babel/preset-react",
            [
                "@babel/preset-env",
                Object.assign(
                    {
                        useBuiltIns: "entry",
                        corejs: 3,
                        shippedProposals: true,
                    },
                    options && options.envConfig
                ),
            ],
        ],
        plugins: ["macros"],
    };
}

function bundleAnalyzerPlugin() {
    const {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer");
    return new BundleAnalyzerPlugin({
        analyzerMode: "static",
        reportFilename: "bundle-report.html",
    });
}

function htmlWebpackPlugin(options) {
    if (!options) return;
    const HtmlWebpackPlugin = require("html-webpack-plugin");
    return new HtmlWebpackPlugin(
        Object.assign(
            {
                inject: false,

                templateParameters: (_, assets) => {
                    /**
                     * @param {string} chunkName
                     */
                    const assertChunk = (chunkName) => {
                        const chunk = assets.chunks[chunkName];
                        if (!chunk) {
                            // prettier-ignore
                            throw new Error(`Unknown entry '${chunkName}'. Available entries ${Object.keys(assets.chunks).join(", ")}`);
                        }
                    };

                    return {
                        htmlWebpackPlugin: {files: assets},

                        /**
                         * @param {string} chunkName
                         * @returns {string}
                         */
                        renderHash(chunkName) {
                            assertChunk(chunkName);
                            return assets.chunks[chunkName].hash;
                        },

                        /**
                         * @param {string} chunkName
                         */
                        renderHashedChunk(chunkName) {
                            assertChunk(chunkName);
                            // prettier-ignore
                            return `${assets.chunks[chunkName].entry}?v=${assets.chunks[chunkName].hash}`;
                        },

                        /**
                         * @param {string} chunkName
                         */
                        renderScriptTag(chunkName) {
                            assertChunk(chunkName);
                            // prettier-ignore
                            return `<script src="${this.renderHashedChunk(chunkName)}"></script>`;
                        },
                    };
                },
            },
            options
        )
    );
}

/**
 * https://webpack.js.org/plugins/split-chunks-plugin/#split-chunks-example-1
 */
function extractCommons() {
    return {
        splitChunks: {
            cacheGroups: {
                commons: {
                    name: "commons",
                    chunks: "initial",
                    minChunks: 2,
                },
            },
        },
    };
}

function createWebpackConfig(options = {}, customize) {
    if (options.emotion) {
        throw new Error(
            "Emotion option is gone. Use babelPlugins option to enable it manually"
        );
    }

    return (_, args) => {
        const isProduction = args.mode === "production";
        // For some reason --mode option does not set NODE_ENV for .babelrc.js
        if (args.hot) {
            // always development with --hot
            process.env.NODE_ENV = "development";
        } else {
            // Otherwise it's just development or production
            process.env.NODE_ENV = args.mode;
        }

        let config = getDefaultConfig();

        if (options.hashFilenames) {
            config.output.filename = "[name]-[chunkhash].js";
        }

        if (isProduction) {
            config.devtool = "source-map";
        }

        if (process.env.DEVTOOL) {
            config.devtool = process.env.DEVTOOL;
        }

        if (options.outputPath) {
            config.output.path = options.outputPath;
            config.devServer.contentBase = options.outputPath;
        }

        if (options.entry) {
            config.entry = options.entry;
        }

        if (options.webpackPlugins) {
            config.plugins.push(...options.webpackPlugins);
        }

        config.module.rules.push(
            getBabelLoaderConfig({
                compileNodeModules: options.compileNodeModules,
            })
        );

        if (options.webpackRules) {
            config.module.rules.push(...options.webpackRules);
        }

        const babelOptions = getBabelOptions({
            envConfig: options.babelEnv,
        });

        if (args.hot) {
            babelOptions.plugins.push("react-hot-loader/babel");
        }

        if (options.babelPlugins) {
            options.babelPlugins.forEach((plugin) => {
                if (typeof plugin === "function") {
                    babelOptions.plugins.push(plugin(args));
                } else {
                    babelOptions.plugins.push(plugin);
                }
            });
        }

        // Global read by ./babel-loader.js
        Object.assign(global, {
            valuWebpackConfig: {
                customizeBabelOptions: options.customizeBabelOptions,
                args: args,
                babelOptions,
            },
        });

        if (options.extractCommons && options.entry) {
            Object.assign(config.optimization, extractCommons());
        }

        if ("maxChunks" in options) {
            config.plugins.push(
                new webpack.optimize.LimitChunkCountPlugin({
                    maxChunks: options.maxChunks,
                })
            );
        }

        if (options.env) {
            config.plugins.push(new webpack.EnvironmentPlugin(options.env));
        }

        if (options.extractCss && isProduction) {
            const cssLoader = getCssLoaderConfig({
                extractCss: true,
                sass: options.sass,
            });

            config.module.rules.push(cssLoader);

            const MiniCssExtractPlugin = require("mini-css-extract-plugin");
            config.plugins.push(new MiniCssExtractPlugin());

            const TerserPlugin = require("terser-webpack-plugin");
            const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
            config.optimization.minimizer = [
                new TerserPlugin({sourceMap: true}),

                // What the shit. When the optimize-css plugin is added we must
                // manually configure the js minifier too
                new OptimizeCSSAssetsPlugin({
                    cssProcessorOptions: {
                        map: {inline: true, annotations: true},
                    },
                }),
            ];
        } else {
            const cssLoader = getCssLoaderConfig({
                sass: options.sass,
            });
            config.module.rules.push(cssLoader);
        }

        if (!isProduction) {
            config.module.rules.push({
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                loader: "url-loader",
            });
        }

        const devServerPort = args.port || options.devServerPort || 8080;

        config.devServer.port = devServerPort;

        const publicPath = options.publicPath || "";

        if (!isProduction && options.cors) {
            const host = options.devServerHost || "localhost";
            config.output.publicPath = `http://${host}:${devServerPort}${publicPath}`;
            config.devServer.headers = {
                "Access-Control-Allow-Origin": "*",
            };
        } else {
            config.output.publicPath = publicPath;
        }

        if (options.historyApiFallback) {
            config.devServer.historyApiFallback = options.historyApiFallback;
        }

        if (options.bundleAnalyzerPlugin || process.env.ANALYZE) {
            config.plugins.push(bundleAnalyzerPlugin());
        }

        if (options.template) {
            config.plugins.push(
                htmlWebpackPlugin({template: options.template})
            );
        } else if (options.htmlPlugin) {
            config.plugins.push(
                htmlWebpackPlugin(
                    Object.assign(
                        {template: options.template},
                        options.htmlPlugin
                    )
                )
            );
        }

        if (options.manifest !== false) {
            config.plugins.push(
                new WebpackAssetsManifest({
                    writeToDisk: true,
                })
            );
        }

        if (options.minimize === false) {
            Object.assign(config.optimization, {minimize: false});
        }

        if (typeof options.customize === "function") {
            config = options.customize(config, _, args) || config;
        }

        if (typeof customize === "function") {
            config = customize(config, _, args) || config;
        }

        return config;
    };
}

module.exports = {
    createWebpackConfig,
    getBabelConfig: (options) => {
        console.warn(
            "[@valu/webpack-config Deprecated] getBabelConfig() has been renamed to getBabelOptions()"
        );
        return getBabelOptions(options);
    },
    getBabelOptions,
    autoloadEntries,
};
