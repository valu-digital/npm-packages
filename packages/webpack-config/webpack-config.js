function bundleAnalyzerPlugin(activate) {
    if (!activate) return;
    const {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer");
    return new BundleAnalyzerPlugin();
}

function htmlWebpackPlugin(options) {
    if (!options) return;
    const HtmlWebpackPlugin = require("html-webpack-plugin");
    return new HtmlWebpackPlugin(options);
}

function createWebpackConfig(options = {}) {
    console.log("wat1");
    return (_, args) => {
        console.log("wat3");
        process.exit();
        // Pass for babel config
        if (args.hot) {
            process.env.NODE_ENV = "development";
        } else {
            process.env.NODE_ENV = args.mode;
        }

        return {
            entry: {
                main: "./src/index.tsx",
            },

            output: {
                filename: "[name].[hash].js",
                path: process.cwd() + "/dist",
            },

            devServer: {
                contentBase: process.cwd() + "/dist",
            },

            resolve: {
                extensions: [".ts", ".tsx", ".mjs", ".jsx", ".js", ".json"],
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
            ].filter(Boolean),
        };
    };
}

module.exports = createWebpackConfig;
