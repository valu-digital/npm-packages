const webpack = require("webpack");
const {execSync} = require("child_process");
const gitRev = execSync("git rev-parse HEAD").toString();
const gitDate = new Date(
    execSync("git log -1 --format=%cd").toString()
).toISOString();

function getConfig(options) {
    return {
        entry: {
            main: "./src/index",
        },

        output: {
            filename: "[name].js",
            path: process.cwd() + "/dist",
        },

        devServer: {
            // With dev server server files from the dist directory
            contentBase: process.cwd() + "/dist",
        },

        resolve: {
            // The default extensions are quite lame.
            // the .mjs enables tree shaking for some npm modules
            extensions: [".tsx", ".ts", ".mjs", ".jsx", ".js", ".json"],
        },

        module: {
            rules: [
                {test: /\.(ts|tsx|js|jsx)$/, loader: "babel-loader"},
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
            ],
        },

        plugins: [
            bundleAnalyzerPlugin(options.bundleAnalyzerPlugin),
            htmlWebpackPlugin(options.htmlPlugin),
            new webpack.DefinePlugin({
                WEBPACK_GIT_DATE: JSON.stringify(gitDate),
                WEBPACK_GIT_REV: JSON.stringify(gitRev),
                WEBPACK_BUILD_DATE: JSON.stringify(new Date().toISOString()),
            }),
        ].filter(Boolean),
    };
}

function bundleAnalyzerPlugin(activate) {
    if (!activate) return;
    const {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer");
    return new BundleAnalyzerPlugin();
}

function htmlWebpackPlugin(options) {
    if (!options) return;
    const HtmlWebpackPlugin = require("html-webpack-plugin");
    return new HtmlWebpackPlugin({
        inject: false,

        templateParameters: (_, assets) => {
            return {
                htmlWebpackPlugin: {files: assets},

                renderHashedEntry(entry) {
                    // prettier-ignore
                    return `${assets.chunks[entry].entry}?v=${assets.chunks[entry].hash}`;
                },

                renderScriptTag(entry) {
                    // prettier-ignore
                    return `<script src="${this.renderHashedEntry(entry)}"></script>`;
                },
            };
        },
        ...options,
    });
}

function createWebpackConfig(options = {}, customize) {
    return (_, args) => {
        // For some reason --mode option does not set NODE_ENV for .babelrc.js
        if (args.hot) {
            // alway development with --hot
            process.env.NODE_ENV = "development";
        } else {
            // Otherwise it's just development or production
            process.env.NODE_ENV = args.mode;
        }

        const config = getConfig(options);

        const devServerPort = args.port || options.devServerPort || 8080;
        config.devServer.port = devServerPort;

        if (options.hotCors) {
            config.output.publicPath = `http://localhost:${devServerPort}/`;
            config.devServer.headers = {
                "Access-Control-Allow-Origin": "*",
            };
        }

        if (typeof customize === "function") {
            return customize(config, _, args);
        }

        return config;
    };
}

createWebpackConfig.createWebpackConfig = createWebpackConfig;
module.exports = createWebpackConfig;
