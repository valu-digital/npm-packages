const customizedBabelLoader = require("babel-loader").custom(() => {
    return {
        config(cfg) {
            const config = global.valuWebpackConfig;
            if (!config || !config.babelOptions) {
                throw new Error(
                    "bug: global.valuWebpackConfig.babelOptions not defined"
                );
            }

            let options = config.babelOptions;
            let hasFsConfig = cfg.hasFilesystemConfig();

            if (typeof config.customizeBabelOptions === "function") {
                const custom = config.customizeBabelOptions({
                    options,
                    babelrc: cfg.babelrc,
                    filename: cfg.options.filename,
                    babelrcOptions: {
                        plugins: cfg.options.plugins || [],
                        presets: cfg.options.presets || [],
                    },
                    hasFilesystemConfig: hasFsConfig,
                });

                if (custom) {
                    return {...cfg.options, ...custom};
                }
            }

            if (hasFsConfig) {
                return cfg.options;
            }

            return {...cfg.options, ...options};
        },
    };
});

module.exports = customizedBabelLoader;
