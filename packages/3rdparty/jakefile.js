const { sh } = require("sh-thunk");
task(
    "bundle-head",
    sh`
        mkdir -p dist
        node --max-old-space-size=8192 node_modules/.bin/microbundle \
            --compress true \
            --entry src/iframes-head.ts \
            --output dist/iframes-head.min.js \
            --sourcemap false \
            --format iife \
            --target  web \
            --external none \
            --pkg-main false \
            --tsconfig tsconfig.json
`,
);

task("build-src", sh`tsc -p tsconfig.build.json`);
task("clean", sh`rm -rf dist`);
task("build", ["clean", "build-src", "bundle-head"]);

task(
    "build-pack",
    ["build"],
    sh`
        npm pack
    `,
);
