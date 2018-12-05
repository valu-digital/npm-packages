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
     * Custom dev server host for CORS usage. Defaults to localhost
     */
    devServerHost?: string;

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
    options?: Options,
    customize: (options: Options) => any
): WebpackConfig;
export default createWebpackConfig;

declare global {
    const WEBPACK_GIT_DATE: string;
    const WEBPACK_GIT_REV: string;
    const WEBPACK_BUILD_DATE: string;
}
