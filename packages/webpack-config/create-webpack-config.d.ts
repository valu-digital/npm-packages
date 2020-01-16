/**
 * Generate Webpack entries from the given directory
 */
export function autoloadEntries(dir: string): {[key: string]: string};

interface HtmlPluginOptions {
    template: string;
}

interface Options {
    /**
     * Port to listen with the dev server
     */
    devServerPort?: number;

    /**
     * https://github.com/jantimon/html-webpack-plugin#options
     */
    htmlPlugin?: HtmlPluginOptions;

    /**
     * Shorcut for the htmlPlugin template option
     */
    template?: string;

    /**
     * Allow hot module replacement over and dynamic imports over CORS domains
     * during development
     */
    cors?: boolean;

    /**
     * Add hash to the generated files
     */
    hashFilenames?: boolean;

    /**
     * Custom dev server host for CORS usage. Defaults to localhost
     */
    devServerHost?: string;

    /**
     *
     */
    outputPath?: string;

    /**
     *  https://webpack.js.org/configuration/output/#output-publicpath
     */
    publicPath?: string;

    /**
     * https://webpack.js.org/configuration/dev-server/#devserver-historyapifallback
     */
    historyApiFallback?: boolean;

    /**
     * https://github.com/webpack-contrib/webpack-bundle-analyzer
     */
    bundleAnalyzerPlugin?: boolean;

    /**
     * https://webpack.js.org/plugins/split-chunks-plugin/#split-chunks-example-1
     */
    extractCommons?: boolean;

    /**
     * Extract css bundle
     */
    extractCss?: boolean;

    /**
     * Enable sass loader
     */
    sass?: boolean;

    sassOptions?: any;

    /**
     * Enable custom babel plugins
     */
    babelPlugins?: (string | [string, any] | Function)[];

    /**
     * Enable custom Webpack plugins
     */
    webpackPlugins?: any[];

    /**
     * Array of node_module to compile with Babel
     */
    compileNodeModules?: string[];

    /**
     * Manual customization of babel config without opt-in to a babelrc file
     */
    customizeBabel?: (config: {plugings: any[]; presets: any[]}) => any;

    /**
     * Manual cusomization of the generated config
     */
    customize?: (config: WebpackConfig) => any;
}

interface WebpackConfig {
    entry: any;
    output: any;
    devServer: any;
    resolve: any;
    module: any;
    plugins: any;
    [key: string]: any;
}

export function createWebpackConfig(
    options: Options,
    customize: (options: Options) => any
): WebpackConfig;
export default createWebpackConfig;

declare global {
    const WEBPACK_GIT_DATE: string;
    const WEBPACK_GIT_REV: string;
    const WEBPACK_BUILD_DATE: string;
}
