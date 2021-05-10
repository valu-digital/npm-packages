const plugin = require("./dist/node/plugin");
module.exports = plugin.default;
Object.assign(module.exports, plugin);
