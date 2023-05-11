import { Static, Client } from "webpack-dev-server";
import { assertNotNil } from "@valu/assert";
import PathUtils from "path";
import { Configuration, EnvironmentPlugin } from "webpack";
import WebpackAssetsManifest from "webpack-assets-manifest";
import { ServerOptions } from "https";
import { promises as fs } from "fs";
import { SakkeConfig } from "./types";
import { loadSakkeJSON, logger } from "./utils";
import { sakkeLoaderRule } from "./sakke-webpack-loader";

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
            require("@babel/preset-typescript"),
            require("@babel/preset-react"),
            [
                require("@babel/preset-env"),
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
        plugins: [require("babel-plugin-macros")],
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

    server?: {
        type: "https";
        options: {
            ca: string;
            key: string;
            cert: string;
        };
    };
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
            loader: PathUtils.join(__dirname, "babel-loader.js"),
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

interface WebpackOptions {
    mode: "production" | "development";
    devServer: boolean;
    analyze: boolean;
    wpAdmin: boolean;
}

function removeExtension(filename: string) {
    return filename.replace(/\.[^/.]+$/, "");
}

async function autoloadEntries(
    dir: string,
    options: { adminEntries: boolean },
) {
    const entryFiles = (await fs.readdir(dir)).filter((fileName) => {
        const extOk = EXTENSIONS.some((ext) => fileName.endsWith(ext));
        if (!extOk) {
            return false;
        }

        const isAdminScript = /-admin\.[a-z]+?/.test(fileName);

        if (options.adminEntries) {
            return isAdminScript;
        } else {
            return !isAdminScript;
        }
    });

    return entryFiles.reduce((entry, file) => {
        entry[removeExtension(file)] = PathUtils.join(dir, file);
        return entry;
    }, {} as Record<string, string>);
}

/**
 * These imports are available as global in WordPress admin so we don't need to
 * bundle them when creating admin bundles
 */
const WordPressAdminExternals = {
    "@wordpress/a11y": "wp.a11y",
    "@wordpress/autop": "wp.autop",
    "@wordpress/blob": "wp.blob",
    "@wordpress/blockDirectory": "wp.blockDirectory",
    "@wordpress/blockEditor": "wp.blockEditor",
    "@wordpress/blockLibrary": "wp.blockLibrary",
    "@wordpress/blockSerializationDefaultParser":
        "wp.blockSerializationDefaultParser",
    "@wordpress/blocks": "wp.blocks",
    "@wordpress/components": "wp.components",
    "@wordpress/compose": "wp.compose",
    "@wordpress/coreData": "wp.coreData",
    "@wordpress/data": "wp.data",
    "@wordpress/date": "wp.date",
    "@wordpress/dom": "wp.dom",
    "@wordpress/editPost": "wp.editPost",
    "@wordpress/editor": "wp.editor",
    "@wordpress/element": "wp.element",
    "@wordpress/escapeHtml": "wp.escapeHtml",
    "@wordpress/formatLibrary": "wp.formatLibrary",
    "@wordpress/hooks": "wp.hooks",
    "@wordpress/htmlEntities": "wp.htmlEntities",
    "@wordpress/i18n": "wp.i18n",
    "@wordpress/isShallowEqual": "wp.isShallowEqual",
    "@wordpress/keyboardShortcuts": "wp.keyboardShortcuts",
    "@wordpress/keycodes": "wp.keycodes",
    "@wordpress/mediaUtils": "wp.mediaUtils",
    "@wordpress/notices": "wp.notices",
    "@wordpress/plugins": "wp.plugins",
    "@wordpress/preferences": "wp.preferences",
    "@wordpress/preferencesPersistence": "wp.preferencesPersistence",
    "@wordpress/primitives": "wp.primitives",
    "@wordpress/priorityQueue": "wp.priorityQueue",
    "@wordpress/reusableBlocks": "wp.reusableBlocks",
    "@wordpress/richText": "wp.richText",
    "@wordpress/styleEngine": "wp.styleEngine",
    "@wordpress/url": "wp.url",
    "@wordpress/viewport": "wp.viewport",
    "@wordpress/wordcount": "wp.wordcount",
    react: "React",
    "react-dom": "ReactDOM",
};

export async function createWebpackConfig(
    options: SakkeConfig,
    args: WebpackOptions,
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

    if (args.devServer) {
        const ca = process.env["SAKKE_CA"];
        const cert = process.env["SAKKE_CERT"];
        const key = process.env["SAKKE_KEY"];

        if (ca && cert && key) {
            devServer.server = {
                type: "https",
                options: {
                    ca,
                    cert,
                    key,
                },
            };
        } else {
            throw Error(
                "🛑 You must define SAKKE_CA, SAKKE_CERT and SAKKE_KEY",
            );
        }
    }

    let publicPath = `/wp-content/themes/${wpTheme}/dist/scripts/`;
    if (sakke.publicPath) {
        publicPath = sakke.publicPath;
    }
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
        { adminEntries: args.wpAdmin },
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

    config.module.rules.push(sakkeLoaderRule);

    if (options.webpackRules) {
        config.module.rules.push(...options.webpackRules);
    }

    const babelOptions = getBabelOptions();

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

    if (args.analyze) {
        const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        config.plugins.push(
            new BundleAnalyzerPlugin({
                analyzerMode: "static",
            }),
        );
    }

    assertNotNil(config.output.path);

    if (args.wpAdmin) {
        config.plugins.push(
            new WebpackAssetsManifest({
                output: PathUtils.join(
                    config.output.path,
                    "manifest-admin.json",
                ),
                writeToDisk: true,
            }),
        );

        Object.assign(config.externals, WordPressAdminExternals);
    } else {
        config.plugins.push(
            new WebpackAssetsManifest({
                output: PathUtils.join(config.output.path, "manifest.json"),
                writeToDisk: true,
            }),
        );
    }

    if (!isProduction) {
        Object.assign(config.optimization, { minimize: false });
    }

    if (process.env["SAKKE_SKIP_MINIFY"]) {
        logger.warn("Disabling minification via SAKKE_SKIP_MINIFY");
        Object.assign(config.optimization, { minimize: false });
    }

    if (typeof options.customize === "function") {
        config = options.customize(config, args) || config;
    }

    return config;
}
