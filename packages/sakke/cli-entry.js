#!/usr/bin/env node
require("./dist/cli")
    .cli(process.argv)
    .then(
        (code) => {
            process.exit(code || 0);
        },
        (error) => {
            console.error(error);
            process.exit(2);
        },
    );
