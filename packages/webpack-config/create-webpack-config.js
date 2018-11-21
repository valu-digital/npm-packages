// @ts-check
const webpack = require("webpack");
const fs = require("fs");
const {execSync} = require("child_process");
const gitRev = execSync("git rev-parse HEAD").toString();
const gitDate = new Date(
    execSync("git log -1 --format=%cd").toString()
).toISOString();

/**
 * @param {string} dir
 */
function hasBabelrc(dir) {
    const rcFiles = ["babel.config.js", ".babelrc", ".babelrc.js"];
    return fs.readdirSync(dir).some(file => rcFiles.includes(file));
}

function getDefaultConfig() {
    return {
        entry: {
            main: "./src/index",
        },

        optimization: {},

        output: {
            filename: "[name].js",
            path: process.cwd() + "/dist",
        },

        devServer: {
            // With dev server serve files from the dist directory
            contentBase: process.cwd() + "/dist",
        },

        resolve: {
            // The default extensions are quite lame.
            // the .mjs enables tree shaking for some npm modules
            extensions: [".tsx", ".ts", ".mjs", ".jsx", ".js", ".json"],
        },

        module: {
            rules: [
                {
                    test: /\.(ts|tsx|js|jsx|mjs)$/,
                    use: {
                        loader: "babel-loader",
                    },
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
            ],
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

function createBabelConfig() {
    return {
        presets: [
            "@babel/preset-typescript",
            "@babel/preset-react",
            "@babel/preset-env",
        ],
        plugins: ["@babel/plugin-proposal-class-properties"],
    };
}

function bundleAnalyzerPlugin() {
    const {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer");
    return new BundleAnalyzerPlugin();
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
                    const assertChunk = chunkName => {
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
    return (_, args) => {
        // For some reason --mode option does not set NODE_ENV for .babelrc.js
        if (args.hot) {
            // always development with --hot
            process.env.NODE_ENV = "development";
        } else {
            // Otherwise it's just development or production
            process.env.NODE_ENV = args.mode;
        }

        const config = getDefaultConfig();

        if (options.entry) {
            config.entry = options.entry;
        }

        if (!hasBabelrc(process.cwd())) {
            /** @type any */ // ts-check hack...
            const use = config.module.rules[0].use;
            use.options = createBabelConfig();
        }

        if (options.extractCommons && options.entry) {
            config.optimization = extractCommons();
        }

        const devServerPort = args.port || options.devServerPort || 8080;

        config.devServer.port = devServerPort;

        if (options.hotCors) {
            config.output.publicPath = `http://localhost:${devServerPort}/`;
            config.devServer.headers = {
                "Access-Control-Allow-Origin": "*",
            };
        }

        if (options.historyApiFallback) {
            config.devServer.historyApiFallback = options.historyApiFallback;
        }

        if (options.bundleAnalyzerPlugin) {
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

        if (typeof customize === "function") {
            return customize(config, _, args) || config;
        }

        return config;
    };
}

module.exports = {
    createWebpackConfig,
    createBabelConfig,
};
