const webpack = require("webpack");
const {createWebpackConfig} = require("../../../create-webpack-config");
module.exports = createWebpackConfig({
    htmlPlugin: {
        template: "src/index.php.ejs",
        filename: "out.php",
    },
    webpackPlugins: [
        new webpack.DefinePlugin({
            CHANGE_ME_WITH_DEFINE_PLUGIN: JSON.stringify(
                "CHANGED_WITH_DEFINE_PLUGIN"
            ),
        }),
    ],
});
