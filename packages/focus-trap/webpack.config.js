const {
    createWebpackConfig,
    autoloadEntries,
} = require("@valu/webpack-config");

const isDevServer = Boolean(process.env.WEBPACK_DEV_SERVER);

module.exports = createWebpackConfig({
    outputPath: isDevServer
        ? __dirname + "/examples"
        : __dirname + "/examples-dist",
    entry: autoloadEntries(__dirname + "/examples"),
});
