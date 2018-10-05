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

export function createWebpackConfig(options: Options): WebpackConfig;

export default createWebpackConfig;
