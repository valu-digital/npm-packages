## v4.1.0

2023-05-17

-   Update fonts task [5fb3a19](https://github.com/valu-digital/npm-packages/commit/5fb3a19) - Mikko Virenius
-   Update README.md [673d240](https://github.com/valu-digital/npm-packages/commit/673d240) - Esa-Matti Suuronen

All changes https://github.com/valu-digital/npm-packages/compare/sakke/v4.0.0...sakke/v4.1.0

## v4.0.0

2022-11-22

-   Sakke: Change PrefixWrap ignoredSelector to :root [9549422](https://github.com/valu-digital/npm-packages/commit/9549422) - Sauli Rajala

## v3.2.0

2022-11-04

-   Add webp support and pin node 16 at volta [63b31be](https://github.com/valu-digital/npm-packages/commit/63b31be) - Jussi Makinen

All changes https://github.com/valu-digital/npm-packages/compare/sakke/v3.1.0...sakke/v3.2.0

## v3.1.0

2022-10-24

-   Allow developer to bypass gutenberg style wrapping with body tag [5783c56](https://github.com/valu-digital/npm-packages/commit/5783c56) - Sauli Rajala

## v3.0.2

2022-10-21

-   Add dummy test script [9a8de4c](https://github.com/valu-digital/npm-packages/commit/9a8de4c) - Sauli Rajala
-   Update package-lock.json - Sauli Rajala
-   Always install postcss-prefixwrap version 1.33.0 (#21) [8a7eb63](https://github.com/valu-digital/npm-packages/commit/8a7eb63) - Mikko Paappanen

## v3.0.1

2022-03-07

-   Move prettier as dev dependency [0166440](https://github.com/valu-digital/npm-packages/commit/0166440) - Sauli Rajala

## v3.0.0

2022-03-07

-   Sakke: add support for gutenberg.scss and admin.scss in sakke-plugin [https://github.com/valu-digital/npm-packages/pull/12/](https://github.com/valu-digital/npm-packages/pull/12/) - Sauli Rajala

## v2.1.1

2022-03-07

-   Sakke: Fix `npx sakke css` [https://github.com/valu-digital/npm-packages/pull/11](https://github.com/valu-digital/npm-packages/pull/11) - Sauli Rajala

## v2.1.0

2022-03-07

-   Sakke: Allow usage outside of WP theme folder [https://github.com/valu-digital/npm-packages/pull/14](https://github.com/valu-digital/npm-packages/pull/14) - Sauli Rajala

## v2.0.0

2022-01-05

-   Sakke: Do not wrap sakke-plugin styles to body class [0223a3b](https://github.com/valu-digital/npm-packages/commit/0223a3b). Styles of sakke plugin needs to written so that they apply only to the elements of the plugin - Sauli Rajala

## v1.5.3

2021-12-21

-   Run prettier also for sakke-plugins [2c9ee9a](https://github.com/valu-digital/npm-packages/commit/2c9ee9a) - Sauli Rajala

## v1.5.2

2021-12-17

-   Ensure dev-server does not exit too early [1aef34a](https://github.com/valu-digital/npm-packages/commit/1aef34a) - Esa-Matti Suuronen

## v1.5.1

2021-11-29

-   Fix gulp task awaiting [41ba0fb](https://github.com/valu-digital/npm-packages/commit/41ba0fb) - Esa-Matti Suuronen



## v1.5.0

2021-11-26

-   Add 'sakke init-plugin' command [c4e74c2](https://github.com/valu-digital/npm-packages/commit/c4e74c2) - Esa-Matti Suuronen

## v1.4.0

2021-11-26

-   Implement admin.js and gutenberg.js for sakke-plugins [d322800](https://github.com/valu-digital/npm-packages/commit/d322800) - Esa-Matti Suuronen
-   Fix sakke-plugins and port sakke-loader to typescript [b271a15](https://github.com/valu-digital/npm-packages/commit/b271a15) - Esa-Matti Suuronen
-   Make WordPress globals as externals for admin entries [95c5da7](https://github.com/valu-digital/npm-packages/commit/95c5da7) - Esa-Matti Suuronen
-   Use webpack multicompiler to compile for wp-admin [f83ba69](https://github.com/valu-digital/npm-packages/commit/f83ba69) - Esa-Matti Suuronen

## v1.3.1

2021-11-22

-   Fix gulp watch [9fc1391](https://github.com/valu-digital/npm-packages/commit/9fc1391) - Esa-Matti Suuronen

## v1.3.0

2021-11-22

-   Improve migration docs from @valu/webpack-config
-   Add configure-repository [f11cca6](https://github.com/valu-digital/npm-packages/commit/f11cca6) - Esa-Matti Suuronen
-   Add reset-dist [1241c58](https://github.com/valu-digital/npm-packages/commit/1241c58) - Esa-Matti Suuronen
-   Use sakke minify-js to minify the polyfill loader [b732430](https://github.com/valu-digital/npm-packages/commit/b732430) - Esa-Matti Suuronen
-   Add minify-js task [dd1659b](https://github.com/valu-digital/npm-packages/commit/dd1659b) - Esa-Matti Suuronen

## v1.2.0

2021-11-18

-   Add customize() support [c66e3a4](https://github.com/valu-digital/npm-packages/commit/c66e3a4) - Esa-Matti Suuronen
-   Drop WEBPACK\_\* defines [6099731](https://github.com/valu-digital/npm-packages/commit/6099731) - Esa-Matti Suuronen
-   Add SAKKE_SKIP_MINIFY [2822708](https://github.com/valu-digital/npm-packages/commit/2822708) - Esa-Matti Suuronen
-   Support array plugin format [94baaa1](https://github.com/valu-digital/npm-packages/commit/94baaa1) - Esa-Matti Suuronen
-   Do not crash on missing sakke.json [ac4a29c](https://github.com/valu-digital/npm-packages/commit/ac4a29c) - Esa-Matti Suuronen
-   Require certs only with --serve [3dfe009](https://github.com/valu-digital/npm-packages/commit/3dfe009) - Esa-Matti Suuronen

## v1.1.1

2021-11-17

-   babel dep fixes [2799264](https://github.com/valu-digital/npm-packages/commit/2799264) - Esa-Matti Suuronen

## v1.1.0

2021-11-17

-   Add sakke gulpfile.js

## v1.0.1

2021-11-17

-   Handle cli promise errors [cd59e7b](https://github.com/valu-digital/npm-packages/commit/cd59e7b) - Esa-Matti Suuronen
-   Fix https [b719966](https://github.com/valu-digital/npm-packages/commit/b719966) - Esa-Matti Suuronen

## v1.0.0

2021-11-17

Initial release
