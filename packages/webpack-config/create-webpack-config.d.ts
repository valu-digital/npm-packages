interface HtmlPluginOptions {
    template: string;
}

interface Options {
    devServerPort?: number;
    htmlPlugin?: HtmlPluginOptions;
    hotCors?: boolean;
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

declare global {
    const WEBPACK_GIT_DATE: string;
    const WEBPACK_GIT_REV: string;
    const WEBPACK_BUILD_DATE: string;
}

export function createWebpackConfig(options: Options): WebpackConfig;

export default createWebpackConfig;
