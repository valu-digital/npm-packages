# Epeli's Webpack configuration

[![Greenkeeper badge](https://badges.greenkeeper.io/epeli/webpack-config.svg)](https://greenkeeper.io/)


Too bored to copy paste these configs around
and not able to migrate to Parcel yet so here's my config...

With this you can do just

    npm install @epeli/webpack-config

and in `webpack.config.js`

```js
const createWebpackConfig = require("@epeli/webpack-config");
module.exports = createWebpackConfig();
```

So you'll get

-   babel support
-   dev server
-   css import support
-   typescript extensions support
-   bundle analyzer
-   hot reloading
-   Hashed bundle names
    -   with index.html generation

TODO: document options
