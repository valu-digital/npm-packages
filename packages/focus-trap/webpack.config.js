const {
    createWebpackConfig,
    autoloadEntries,
} = require("@valu/webpack-config");

module.exports = createWebpackConfig({
    outputPath: __dirname + "/examples-dist",
    entry: autoloadEntries(__dirname + "/cypress/fixtures/examples/"),
});
