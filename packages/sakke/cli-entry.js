#!/usr/bin/env node
require("./dist/cli")
    .cli(process.argv)
    .catch((error) => {
        console.error(error);
        process.exit(2);
    });
