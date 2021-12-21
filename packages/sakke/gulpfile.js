const { sh } = require("sh-thunk");
const findProcess = require("find-process");
const fs = require("fs");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const PrefixWrap = require("postcss-prefixwrap");
const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const sass = require("gulp-sass")(require("sass"));

const sourcemaps = require("gulp-sourcemaps");
const livereload = require("gulp-livereload");
const stream = require("stream");

const pkg = require(process.cwd() + "/package.json");
const sakke = require(process.cwd() + "/sakke.json");
const { isFile } = require("./dist/utils");

const getImportBuffer = async (plugin, entry) => {
    const hasIndexFile = await isFile(
        `${process.cwd()}/sakke-plugins/${plugin}/${entry}.scss`,
    );
    if (!hasIndexFile) {
        return Buffer.from("");
    }

    return Buffer.from(
        `.sp-${plugin} { @import "sakke-plugins/${plugin}/${entry}.scss"; }`,
    );
};

/**
 *  Inject sakke plugin entries to the main css bundle
 */
function loadSakkePluginStyles() {
    return new stream.Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        async transform(file, encoding, cb) {
            const pluginsWithStyles = sakke.plugins || [];
            let entry = '';
            if (file.path.endsWith("main.scss")) {
                entry = 'index';
            } else if (file.path.endsWith("main-gutenberg.scss")) {
                entry = 'gutenberg';
            } else if (file.path.endsWith("main-admin.scss")) {
                entry = 'admin';
            }

            if(entry !== ''){
                const indexBuffers = await Promise.all(
                    pluginsWithStyles.map((plugin) => {
                        // If sakke-plugin is defined as simple string, use it as name of sakke-plugin
                        // Otherwise get sakke-plugin name from 'name'-property
                        plugin =
                        typeof plugin === "string" ? plugin : plugin.name;
                        return getImportBuffer(plugin, entry);
                    }),
                );

                file.contents = Buffer.concat([file.contents, ...indexBuffers]);
            }

            cb(null, file);
        },
    });
}

const HAS_TYPESCRIPT = (() => {
    if (pkg.dependencies && pkg.dependencies.typescript) {
        return true;
    }

    if (pkg.devDependencies && pkg.devDependencies.typescript) {
        return true;
    }

    return false;
})();

const ASSET_DEV = ".asset-dev";

const ESLINT_EXTENSIONS = "js,jsx,ts,tsx";

const ROOT = process.cwd();

async function enableProduction() {
    process.env.NODE_ENV = "production";
}

function isProduction() {
    return process.env.NODE_ENV === "production";
}

async function assertProduction() {
    if (sakke.git.production) {
        return;
    }

    console.error("git.production is missing from sakke.json");
    process.exit(2);
}

async function assertStaging() {
    if (sakke.git.staging) {
        return;
    }

    console.error("git.staging is missing from sakke.json");
    process.exit(2);
}

const assertNoGlobalDeploy = sh`
    deploy_script="$(git rev-parse --show-toplevel)/deploy.sh"

    if [ -f "$deploy_script" ]; then
	echo
	echo "There's global deploy script at"
	echo "    $deploy_script"
	echo "You should use that"
	echo
	exit 1
    fi
    `;

function sakkeHook(name) {
    const hook = sh`
	    if [ -f "./.sakke-hooks/${name}" ]; then
		chmod +x "./.sakke-hooks/${name}"
		"./.sakke-hooks/${name}"
	    fi
	`;

    hook.displayName = "sakke-hook: " + name;

    return hook;
}

async function setGitRemote(name, url) {
    if (!url) {
        return;
    }

    await sh`
	    git remote remove ${name} || true
	    git remote add ${name} ${url}
	`();
}

/**
 * Assert that git does not have uncommitted changes
 */
const assertGitClean = sh`
    if [ "$(git status . --porcelain)" != "" ]; then
	echo "Dirty git. Commit changes before continuing."
	exit 1
    fi
    `;

/**
 * Assert your local git is in sync with the remote one.
 *
 * This is important when doing the automatic dist-commit as it ensures that
 * there cannot be any merge conflicts in the build assets.
 */
const assertGitSync = sh`
    git fetch origin --quiet
    branch="$(git rev-parse --abbrev-ref HEAD)"
    git push origin $branch:$branch
    if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/$branch)" ]; then
	echo "You local git is not sync with the remote origin/$branch"
	echo "Ensure it is synced with: git pull origin && git push origin"
	exit 1
    fi
    `;

const assertGitMaster = sh`
    if [ "$(git rev-parse --abbrev-ref HEAD)" != "master" ]; then
	echo "You can deploy to production only from the local master branch"
	exit 1
    fi
    `;

gulp.task(
    "scripts",
    sh`
	    sakke js --production
	    sakke minify-js load-polyfills.js load-polyfills.js > dist/scripts/load-polyfills.js
	`,
);

gulp.task(
    "analyze",
    gulp.series(async () => {
        process.env.ANALYZE = 1;
    }, "scripts"),
);

function configuredPostcss() {
    const plugins = [];

    if (process.argv.includes("--prefix") || isProduction()) {
        plugins.push(autoprefixer());
    }

    if (isProduction()) {
        plugins.push(
            cssnano({
                preset: "default",
            }),
        );
    }

    plugins.push(
        PrefixWrap(".editor-styles-wrapper", {
            whitelist: ["main-gutenberg.css"],
        }),
    );

    return postcss(plugins);
}

/**
 * Get standalone css bundles from sakke plugins
 * TODO: this should be done some other way (outside of sakke-lib),
 *  since this is project specified
 */
async function getActiveSakkePluginStyleEntries() {
    return [];
}

gulp.task("styles", async () => {
    const pluginStyles = await getActiveSakkePluginStyleEntries();

    return gulp
        .src([ROOT + "/assets/styles/*.scss", ...pluginStyles])
        .pipe(loadSakkePluginStyles())
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(configuredPostcss())
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(ROOT + "/dist/styles"))
        .pipe(livereload());
});

gulp.task(
    "fonts",
    sh`
	    mkdir -p dist/fonts
	    find -E assets/fonts  -iregex '.*\\.(woff|woff2|ttf|otf)' -exec cp {} dist/fonts \\;
	`,
);

gulp.task("images", () =>
    gulp
        .src(ROOT + "/assets/images/**/*.{jpg,png,svg,gif}")
        .pipe(
            imagemin([
                imagemin.jpegtran({ progressive: true }),
                imagemin.gifsicle({ interlaced: true }),
                imagemin.svgo({
                    plugins: [
                        { removeUnknownsAndDefaults: false },
                        {
                            cleanupIDs: {
                                prefix: {
                                    toString() {
                                        this.counter = this.counter || 0;
                                        return `id_${this.counter++}_`;
                                    },
                                },
                            },
                        },
                        { removeTitle: true },
                        { removeViewBox: false },
                        { removeDimensions: true },
                    ],
                }),
            ]),
        )
        .pipe(gulp.dest(ROOT + "/dist/images"))
        .pipe(livereload()),
);

gulp.task("asset-dev-enable", sh`touch ${ASSET_DEV}`);

gulp.task("asset-dev-disable", sh`rm -f ${ASSET_DEV}`);

gulp.task(
    "eslint",
    sh`
	if [ "\${ESLINT:-}" != "skip" ]; then
	    eslint . --ext ${ESLINT_EXTENSIONS} --max-warnings 0
	fi
    `,
);

gulp.task(
    "imports",
    sh`ESLINT_IMPORTS=1 eslint . --ext ${ESLINT_EXTENSIONS} --fix`,
);

gulp.task(
    "git-dist-changes-hide",
    sh`
	    mkdir -p dist/scripts dist/styles
	    echo '*' > dist/scripts/.gitignore
	    echo '*' > dist/styles/.gitignore
	    distfiles=$(git ls-files "dist/**")
	    if [ "$distfiles" != "" ]; then
		git update-index --assume-unchanged $distfiles
	    fi
	`,
);

gulp.task(
    "git-dist-changes-show",
    sh`
	    rm -f dist/scripts/.gitignore dist/styles/.gitignore
	    distfiles=$(git ls-files "dist/**")
	    if [ "$distfiles" != "" ]; then
		git update-index --no-assume-unchanged $distfiles
	    fi
	`,
);

gulp.task("clean", sh`rm -rf dist`);

gulp.task(
    "reset-dist",
    sh`
	    git clean -fdx dist/
	    git checkout $(git ls-files dist)
	`,
);

gulp.task(
    "prettier",
    sh`prettier --write "assets/**/*.{js,jsx,ts,tsx,css,scss}" "sakke-plugins/**/*.{js,jsx,ts,tsx,css,scss}"`,
);

/**
 * Ensure prettier has been executed properly for all Javascript files
 */
gulp.task(
    "prettier-check",
    sh`
	    prettier --check "assets/**/*.{js,jsx,ts,tsx,css,scss}" "sakke-plugins/**/*.{js,jsx,ts,tsx,css,scss}" || {
		echo "Run it with: npm run prettier"
		echo
		echo "    You should really enable Prettier formatting on save!"
		echo
		echo "    PHPStorm: https://prettier.io/docs/en/webstorm.html"
		echo "    VSCode:   https://github.com/prettier/prettier-vscode#format-on-save"
		echo
		exit 1
	    }
	`,
);

gulp.task(
    "watch",
    gulp.series(
        "asset-dev-enable",
        "git-dist-changes-hide",
        "styles",
        "images",
        (done) => {
            livereload.listen({ port: sakke.livereload.port });
            sh`sakke js --serve`();

            gulp.watch(
                [ROOT + "/assets/styles/**", ROOT + "/sakke-plugins/**/*.scss"],
                gulp.series("styles"),
            );

            gulp.watch([ROOT + "/**/*.php"], async () => {
                livereload.reload();
            });

            gulp.watch([ROOT + "/assets/images/**"], gulp.series("images"));

            async function shutdown() {
                try {
                    await fs.promises.stat(ASSET_DEV);
                    // If .asset-dev still exits do not do anything
                    return;
                } catch (error) {
                    // Probably removed. Continue.
                }

                console.error(".asset-dev was removed. Stopping!");

                // webpack-dev-server is annoying and it does not want to die
                const processes = await findProcess("port", sakke.webpack.port);
                for (const proc of processes) {
                    // KILL IT WITH FIRE
                    process.kill(proc.pid, "SIGTERM");
                }

                // Stop the gulp task
                done();

                // Stop the process
                process.exit(0);
            }

            // Monitor the .asset-dev for changes
            fs.watch(ASSET_DEV).on("change", shutdown);
        },
    ),
);

gulp.task(
    "configure-repository",
    gulp.series("git-dist-changes-hide", async () => {
        await setGitRemote("production", sakke.git.production);
        await setGitRemote("staging", sakke.git.staging);
    }),
);

gulp.task(
    "build",
    gulp.series(
        enableProduction,
        "asset-dev-disable",
        "clean",
        "styles",
        "scripts",
        "images",
        "fonts",
        sakkeHook("post-build"),
        "git-dist-changes-hide",
    ),
);

/**
 * Check typescript types when Typescript is installed
 */
gulp.task("tsc", async () => {
    if (HAS_TYPESCRIPT) {
        await sh`tsc --noEmit`();
    }
});

gulp.task("test", gulp.series("eslint", "prettier-check", "tsc"));

gulp.task(
    "commit-dist",
    gulp.series(
        assertProduction,
        "test",
        assertGitClean,
        "build",
        sh`
		# Commit babel-gql queries automatically
		if [ -d .queries ]; then
		    git add .queries
		    if [ "$(git diff --cached)" != "" ]; then
			git commit -m "Update persited graphql queries"
		    fi
		fi
	    `,
        sakkeHook("pre-dist-commit"),
        "git-dist-changes-show",
        sh`
		git add dist
		if [ "$(git diff --cached)" != "" ]; then
		    git commit -m "Build dist"
		fi
	    `,
        "git-dist-changes-hide",
    ),
);

gulp.task(
    "deploy-staging",
    gulp.series(
        assertNoGlobalDeploy,
        assertStaging,
        assertGitSync,
        "commit-dist",
        sh`
		set -x

		# find out on which branch were are on
		branch="$(git rev-parse --abbrev-ref HEAD)"

		# push to local branch to matching remote branch
		git push origin $branch:$branch
		git push ${sakke.git.staging} $branch:master --force
	    `,
    ),
);

gulp.task(
    "deploy-production",
    gulp.series(
        assertNoGlobalDeploy,
        assertProduction,
        assertGitMaster,
        assertGitSync,
        "commit-dist",
        sh`
		set -x
		git push origin master:master
		git push ${sakke.git.production} master:master
	    `,
    ),
);
