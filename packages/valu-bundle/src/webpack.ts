import { Static, Client } from "webpack-dev-server";
import { assertNotNil } from "@valu/assert";
import PathUtils from "path";
import { resolve } from "path";
import { DefinePlugin, Configuration, EnvironmentPlugin } from "webpack";
import WebpackAssetsManifest from "webpack-assets-manifest";
import { ServerOptions } from "https";
import { promises as fs, readFileSync } from "fs";
import { SakkeJSON, ValuBundleConfigType } from "./types";

const gitRev = "todogitrev";

const gitDate = "todogitdate";

export const EXTENSIONS = [".tsx", ".ts", ".mjs", ".jsx", ".js"];

/**
 * TypeScript port in progress
 */
type TODO = any;

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

/**
 *
 * @param {{envConfig?: any} | undefined} options
 */
function getBabelOptions() {
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
                    //     options && options.envConfig,
                ),
            ],
        ],
        plugins: ["macros"],
    };
}

function getDefaultWebpackConfig(): Configuration {
    const config: Configuration = {
        entry: {
            main: "./src/index",
        },

        optimization: {},

        output: {
            // Add hash to the chunk filename by default. This ok since it is
            // automatically loaded by the bundled code eg. we don't manually
            // need to write this anywhere
            chunkFilename: "chunk-[id]-[name]-[chunkhash].js",
            filename: "[name]-[chunkhash].js",
            path: process.cwd() + "/dist",
            crossOriginLoading: "anonymous",
        },

        resolve: {
            // The default extensions are quite lame.
            // the .mjs enables tree shaking for some npm modules
            // https://github.com/react-icons/react-icons/issues/154#issuecomment-411036960
            extensions: EXTENSIONS.concat(".json"),
        },

        module: {
            rules: [
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    type: "asset/inline",
                },
            ],
        },
        externals: {
            jquery: "jQuery",
        },

        plugins: [],
    };

    const devServer: DevServerConfig = {
        hot: false,
        static: {},
        allowedHosts: "all",
        client: {
            webSocketURL: {},
        },
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
        // With dev server serve files from the dist directory
    };

    Object.assign(config, { devServer });

    return config;
}

export interface DevServerConfig {
    hot: boolean;
    port?: number;
    headers?: Record<string, string>;
    static: Static;
    client: Client;
    http2?: boolean;
    allowedHosts?: string;

    https?: ServerOptions;
    historyApiFallback?: TODO;
}

export interface BabelLoaderConfig {
    compileNodeModules?: string[];
}

function getBabelLoaderConfig(options: BabelLoaderConfig = {}) {
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
        exclude(modulePath: string) {
            const nodeModuleToCompile = pathMatchers.some((includeModule) =>
                modulePath.includes(includeModule),
            );

            if (nodeModuleToCompile) {
                return false;
            }

            return /node_modules/.test(modulePath);
        },
    };
}

export interface BabelOptions {
    presets: any[];
    plugins: any[];
    [key: string]: any;
}

export interface CSSLoaderConfig {}

function getCssLoaderConfig(options: CSSLoaderConfig) {
    //     if (options.extractCss) {
    //         const MiniCssExtractPlugin = require("mini-css-extract-plugin");
    //         styleLoader = { loader: MiniCssExtractPlugin.loader };
    //     }

    return {
        test: /\.(css|scss)$/,
        use: [
            "style-loader",

            {
                loader: "css-loader",
                options: {
                    sourceMap: true,
                    //     url: !options.extractCss,
                },
            },

            //     options.sass
            //         ? {
            //               loader: "sass-loader",
            //               options: { sourceMap: true },
            //           }
            //         : null,
            //     hasPostCSSConfig(process.cwd())
            //         ? {
            //               loader: "postcss-loader",
            //           }
            //         : null,
        ].filter(Boolean),
    };
}

export interface Customizer {
    (config: Configuration, _: unknown, args: TODO): Configuration;
}

interface Args {
    mode: "production" | "development";
    devServer: boolean;
    analyze: boolean;
}

function removeExtension(filename: string) {
    return filename.replace(/\.[^/.]+$/, "");
}

async function autoloadEntries(dir: string) {
    const entryFiles = (await fs.readdir(dir)).filter((fileName) =>
        EXTENSIONS.some((ext) => fileName.endsWith(ext)),
    );

    return entryFiles.reduce((entry, file) => {
        entry[removeExtension(file)] = PathUtils.join(dir, file);
        return entry;
    }, {} as TODO);
}

async function loadSakkeJSON() {
    const data = await fs.readFile(PathUtils.join(process.cwd(), "sakke.json"));
    return SakkeJSON.parse(JSON.parse(data.toString()));
}

export async function createWebpackConfig(
    options: ValuBundleConfigType,
    args: Args,
) {
    const isProduction = args.mode === "production";
    // For some reason --mode option does not set NODE_ENV for .babelrc.js
    process.env["NODE_ENV"] = args.mode ?? "development";

    const wpTheme = PathUtils.basename(process.cwd());
    const sakke = await loadSakkeJSON();

    let config = getDefaultWebpackConfig();
    config.mode = args.mode;

    assertNotNil(config.output);

    if (isProduction && options.productionSourceMaps) {
        config.devtool = "source-map";
    } else if (!isProduction) {
        config.devtool = "eval-cheap-source-map";
    }

    const devServer: DevServerConfig = (config as TODO).devServer;

    const ca = readFileSync(
        "/Users/esamatti1/Library/Application Support/mkcert/rootCA.pem",
    );
    const cert = readFileSync(
        "/Users/esamatti1/code/valu-playbooks/development_certs/localhost/fullchain.pem",
    );

    const key = readFileSync(
        "/Users/esamatti1/code/valu-playbooks/development_certs/localhost/privkey.pem",
    );

    devServer.https = { ca, cert, key };

    const publicPath = `/wp-content/themes/${wpTheme}/dist/scripts/`;
    const outputPath = PathUtils.join(process.cwd(), "dist/scripts");

    devServer.static.publicPath = `https://${sakke.webpack.host}:${sakke.webpack.port}${publicPath}`;
    devServer.client.webSocketURL = {
        hostname: sakke.webpack.host,
        port: sakke.webpack.port,
    };

    config.output.publicPath = publicPath;
    config.output.path = outputPath;

    if (args.devServer) {
        config.output.publicPath = devServer.static.publicPath;
    }

    config.entry = await autoloadEntries(
        PathUtils.join(process.cwd(), "assets/scripts"),
    );

    if (!config.plugins) {
        config.plugins = [];
    }

    if (options.webpackPlugins) {
        config.plugins.push(...options.webpackPlugins);
    }

    if (!config.module) {
        config.module = {};
    }

    if (!config.module.rules) {
        config.module.rules = [];
    }

    config.module.rules.push(
        getBabelLoaderConfig({
            compileNodeModules: options.compileNodeModules,
        }),
    );

    if (options.webpackRules) {
        config.module.rules.push(...options.webpackRules);
    }

    const babelOptions = getBabelOptions();

    if (options.babelPlugins) {
        options.babelPlugins.forEach((plugin) => {
            if (typeof plugin === "function") {
                babelOptions.plugins.push(plugin(args));
            } else if (typeof plugin === "string") {
                babelOptions.plugins.push(plugin);
            } else {
                throw new Error(
                    "[@valu/bundle] unsupported babel plugin format!",
                );
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

    //     if (options.extractCommons && options.entry) {
    //         Object.assign(config.optimization, extractCommons());
    //     }

    //     if (options.maxChunks) {
    //         config.plugins.push(
    //             new optimize.LimitChunkCountPlugin({
    //                 maxChunks: options.maxChunks,
    //             }),
    //         );
    //     }

    if (options.env) {
        config.plugins.push(new EnvironmentPlugin(options.env));
    }

    // if (options.extractCss && isProduction) {
    //     const cssLoader = getCssLoaderConfig({
    //         extractCss: true,
    //         sass: options.sass,
    //     });

    //     config.module.rules.push(cssLoader);

    //     const MiniCssExtractPlugin = require("mini-css-extract-plugin");
    //     config.plugins.push(new MiniCssExtractPlugin());

    //     const TerserPlugin = require("terser-webpack-plugin");
    //     const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
    //     config.optimization.minimizer = [
    //         new TerserPlugin({ sourceMap: true }),

    //         // What the shit. When the optimize-css plugin is added we must
    //         // manually configure the js minifier too
    //         new OptimizeCSSAssetsPlugin({
    //             cssProcessorOptions: {
    //                 map: { inline: true, annotations: true },
    //             },
    //         }),
    //     ];
    // } else {
    const cssLoader = getCssLoaderConfig({
        // sass: options.sass,
    });
    config.module.rules.push(cssLoader);
    // }

    devServer.port = sakke.webpack.port;

    //     if (!isProduction && options.cors) {
    //         const host = options.devServerHost || "localhost";
    //         config.output.publicPath = `http://${host}:${devServerPort}${publicPath}`;
    //         devServer.headers = {
    //             "Access-Control-Allow-Origin": "*",
    //         };
    //     } else {

    //     if (args.devServer) {
    //         config.output.publicPath = `http://${sakke.webpack.host}:${sakke.webpack.port}${publicPath}`;
    //         // config.output.publicPath = "auto";
    //     } else {
    //         config.output.publicPath = publicPath;
    //     }

    //     }

    //     if (options.historyApiFallback) {
    //         devServer.historyApiFallback = options.historyApiFallback;
    //     }

    if (args.analyze) {
        const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        config.plugins.push(
            new BundleAnalyzerPlugin({
                analyzerMode: "static",
            }),
        );
    }

    assertNotNil(config.output.path);

    config.plugins.push(
        new WebpackAssetsManifest({
            output: PathUtils.join(config.output.path, "manifest.json"),
            writeToDisk: true,
        }),
    );

    config.plugins.push(
        new DefinePlugin({
            WEBPACK_GIT_DATE: JSON.stringify(gitDate),
            WEBPACK_GIT_REV: JSON.stringify(gitRev),
            WEBPACK_BUILD_DATE: JSON.stringify(new Date().toISOString()),
        }),
    );

    if (!isProduction) {
        Object.assign(config.optimization, { minimize: false });
    }

    //     config.resolve = {
    //         alias: {
    //             jquery: PathUtils.join(process.cwd(), ""),
    //         },
    //     };

    //     if (typeof options.customize === "function") {
    //         config = options.customize(config, _, args) || config;
    //     }

    return config;
}
