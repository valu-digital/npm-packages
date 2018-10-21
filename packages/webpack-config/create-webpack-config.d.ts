interface HtmlPluginOptions {
    template: string;
}

interface Options {
    devServerPort?: number;
    htmlPlugin?: HtmlPluginOptions;
    hotCors?: boolean;
    bundleAnalyzerPlugin?: boolean;
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
