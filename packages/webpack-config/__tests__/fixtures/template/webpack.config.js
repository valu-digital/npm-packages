const {createWebpackConfig} = require("../../../create-webpack-config");
module.exports = createWebpackConfig({
    htmlPlugin: {
        template: "src/index.php.ejs",
        filename: "out.php",
    },
});
