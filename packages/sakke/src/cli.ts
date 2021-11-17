import { webpack } from "webpack";
import WebpackDevServer from "webpack-dev-server";
import PathUtils from "path";
import arg from "arg";
import { SakkeConfigParser } from "./types";
import { createWebpackConfig } from "./webpack";

function parseJSArgs(argv: string[]) {
    return arg(
        {
            "--production": Boolean,
            "-p": "--production",

            "--serve": Boolean,
            "-s": "--serve",

            "--analyze": Boolean,
            "-a": "--analyze",

            "--debug": Boolean,
            "-d": "--debug",

            "--help": Boolean,
            "-h": "--help",

            "--config": String,
            "-c": "--config",
        },
        { argv },
    );
}

async function gulpWrap(argv: string[]) {
    console.log("args", argv);
    require("../gulpfile.js");
    const gulp = require("gulp");
    await gulp.task(argv[0])();
}

async function bundleJS(argv: string[]) {
    const args = parseJSArgs(argv);

    const configPath =
        args["--config"] ?? PathUtils.join(process.cwd(), "sakke.config.js");

    const valuBundleConfig = SakkeConfigParser.safeParse(require(configPath));

    if (!valuBundleConfig.success) {
        console.error("Invalid sakke.config.js config at", configPath);
        console.error(valuBundleConfig.error.errors);
        process.exit(5);
    }

    const config = await createWebpackConfig(valuBundleConfig.data, {
        mode: args["--production"] ? "production" : "development",
        devServer: Boolean(args["--serve"]),
        analyze: Boolean(args["--analyze"]),
    });

    if (args["--debug"]) {
        console.log("Generated Webpack config");
        console.log(config);
        process.exit(0);
    }

    const compiler = webpack(config);

    if (args["--serve"]) {
        const server = new WebpackDevServer({ ...config.devServer }, compiler);
        await server.start();
    } else {
        compiler.run((err, stats) => {
            if (err) {
                console.error("Webpack error", err);
                process.exit(2);
            }

            console.error(stats?.toString());

            if (stats?.hasErrors()) {
                process.exit(3);
            }
        });
    }
}

function help() {
    console.error(`
usage: sakke <subcommand> <options>

    example: sakke js --production
             sakke js --serve
`);
}

export async function cli(argv: string[]) {
    if (argv[2] === "js") {
        return await bundleJS(argv.slice(3));
    } else if (argv[2] === "gulp") {
        return await gulpWrap(argv.slice(3));
    } else if (!argv[2]) {
        help();
        process.exit(1);
    } else {
        console.error("Unknown subcommand. Only 'js' is supported atm.");
        help();
        process.exit(1);
    }
}
