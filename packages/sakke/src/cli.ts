import { webpack } from "webpack";
import WebpackDevServer from "webpack-dev-server";
import PathUtils from "path";
import arg from "arg";
import { SakkeConfigParser } from "./types";
import { createWebpackConfig } from "./webpack";
import { promises as fs } from "fs";
import { initSakkePlugin } from "./init-sakke-plugin";
import { logger } from "./utils";

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

/**
 * Capture any errors happening in background.
 */
function monitorErrors() {
    // There are two types of errors at least. Thrown errors or promise
    // rejections. Capture both.

    let rejectedPromise: undefined | Promise<unknown> = undefined;
    let capturedError: Error | undefined = undefined;

    let onError: Function;
    const onErrorPromise = new Promise((r) => (onError = r));

    const captureRejection = (
        reason: {} | null | undefined,
        promise: Promise<unknown>,
    ) => {
        rejectedPromise = promise;
        onError();
    };

    const captureError = (error: Error) => {
        capturedError = error;
        onError();
    };

    process.on("unhandledRejection", captureRejection);
    process.on("uncaughtException", captureError);

    return {
        clear() {
            process.off("unhandledRejection", captureRejection);
            process.off("uncaughtException", captureError);
        },

        waitForError() {
            return onErrorPromise;
        },

        async getError() {
            if (capturedError) {
                return capturedError;
            }

            if (rejectedPromise) {
                return await rejectedPromise;
            }
        },
    };
}

async function gulp(argv: string[]) {
    require("../gulpfile.js");
    const gulp = require("gulp");
    const taskName = argv[0];
    if (!taskName) {
        console.error("[sakke] You must pass task name argument to gulp");
        return 34;
    }

    const task = gulp.task(taskName);
    if (!task) {
        console.error(`Unknown gulp task "${argv[0]}`);
        return 9;
    }

    const wrapTaskName = taskName + "-wrap";

    // Ok, gulp is not too usable to be used inside a library. I was not able to
    // find a way to monitor when the task completes so we workaround it here by
    // creating another task on the fly where the original task is a "series"
    // dependency and we wait for the wrapped task to complete

    // Create promise of the wrapped task completion but do not await it yet
    const wrapPromise = new Promise<void>((resolve) => {
        gulp.task(wrapTaskName, gulp.series(taskName, resolve));
    });

    // Capture any unhandled errors since gulp does not return them to us
    const cap = monitorErrors();

    // Invoke the wrapped task
    gulp.task(wrapTaskName)();

    // Aaand wait for the wrapped task to complete or error via the monitor
    await Promise.race([wrapPromise, cap.waitForError()]);

    // Stop capturing unhandled errors
    cap.clear();

    const error = await cap.getError();
    if (error) {
        console.error(error);
        logger.error(`Gulp task "${taskName}" failed`);
        return 1;
    }

    // It might be a better idea to just invoke the gulp tasks in a subprocess.
    // That way it would be way easier to detect when it exits and if it was an
    // error
}

async function minifyJSFile(filePath: string) {
    // Import terser only when it is used. Can be a bit large so avoid requiring
    // unless needed.
    const minify: typeof import("terser").minify = require("terser").minify;

    const code = await fs.readFile(filePath).catch((error) => {
        if (error.code !== "ENOENT") {
            throw error;
        }
    });

    if (!code) {
        return;
    }

    const res = await minify(code.toString(), {
        mangle: {
            eval: true,
        },
        compress: true,
    });

    if (res.code) {
        process.stdout.write(res.code);
    }
}

async function bundleJS(argv: string[]): Promise<number> {
    const args = parseJSArgs(argv);

    const configPath =
        args["--config"] ?? PathUtils.join(process.cwd(), "sakke.config.js");

    const valuBundleConfig = SakkeConfigParser.safeParse(require(configPath));

    if (!valuBundleConfig.success) {
        console.error("Invalid sakke.config.js config at", configPath);
        console.error(valuBundleConfig.error.errors);
        return 5;
    }

    const frontendConfig = await createWebpackConfig(valuBundleConfig.data, {
        mode: args["--production"] ? "production" : "development",
        devServer: Boolean(args["--serve"]),
        analyze: Boolean(args["--analyze"]),
        wpAdmin: false,
    });

    const adminConfig = await createWebpackConfig(valuBundleConfig.data, {
        mode: args["--production"] ? "production" : "development",
        devServer: Boolean(args["--serve"]),
        analyze: Boolean(args["--analyze"]),
        wpAdmin: true,
    });

    if (args["--debug"]) {
        console.log("Generated Webpack frontend config:");
        console.log(frontendConfig);
        console.log("Generated Webpack wp-admin config:");
        console.log(adminConfig);
        return 0;
    }

    const compiler = webpack([frontendConfig, adminConfig]);

    if (args["--serve"]) {
        const server = new WebpackDevServer(
            { ...frontendConfig.devServer },
            compiler,
        );
        await server.start();

        await new Promise((resolve) => {
            server.server.on("close", resolve);
        });
    } else {
        return new Promise<number>((resolve) => {
            compiler.run((err, stats) => {
                if (err) {
                    console.error("Webpack error", err);
                    resolve(3);
                }

                console.error(stats?.toString());

                if (stats?.hasErrors()) {
                    resolve(3);
                }
            });
        });
    }

    return 0;
}

function help() {
    console.error(`
usage: sakke [subcommand] <options>

    example:

             sakke dev                        # Run all dev watchers
             sakke build                      # Build everything for production
             sakke js --production            # Build JS for production
             sakke js --serve                 # Serve JS for development
             sakke css                        # Build CSS for production
             sakke minify-js                  # Minify single JS file to stdout
             sakke init-plugin [plugin name]  # Init new sakke plugin
             sakke gulp [legacy gulp task]
`);
}

export async function cli(argv: string[]) {
    if (argv[2] === "js") {
        return await bundleJS(argv.slice(3));
    } else if (argv[2] === "minify-js" && argv[3]) {
        return await minifyJSFile(argv[3]);
    } else if (argv[2] === "init-plugin") {
        return await initSakkePlugin(argv.slice(3));
    } else if (argv[2] === "gulp") {
        return await gulp(argv.slice(3));
    } else if (argv[2] === "configure-repository") {
        return await gulp(["configure-repository"]);
    } else if (argv[2] === "reset-dist") {
        return await gulp(["reset-dist"]);
    } else if (argv[2] === "deploy-production") {
        return await gulp(["deploy-production"]);
    } else if (argv[2] === "deploy-staging") {
        return await gulp(["deploy-staging"]);
    } else if (argv[2] === "build") {
        return await gulp(["build"]);
    } else if (argv[2] === "css") {
        return await gulp(["styles"]);
    } else if (argv[2] === "dev" || argv[2] === "watch") {
        return await gulp(["watch"]);
    } else if (argv[2] === "-h" || argv[2] === "--help") {
        help();
        return 0;
    } else if (!argv[2]) {
        help();
        return 1;
    } else {
        console.error("Unknown subcommand ");
        help();
        return 1;
    }
}
