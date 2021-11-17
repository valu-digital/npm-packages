const { promises: fs } = require("fs");
const PathUtils = require("path");
const sakke = require(process.cwd() + "/sakke.json");

async function isFile(path) {
    return fs.stat(path).then(
        (stat) => stat.isFile(),
        () => false, // "try-catch" error on missing files etc.
    );
}

async function sakkeLoader(context, source) {
    if (!sakke.plugins) {
        return source;
    }

    /**
     * This function checks if there is index.js -file in sakke-plugin root-folder.
     * and if there is => returns import -statement for that file
     *
     * @param dir
     * @return {Promise<string|null>}
     */
    const getImportStament = async (dir, index) => {
        const hasIndexFile = await isFile(
            `${process.cwd()}/sakke-plugins/${dir}/index.js`,
        );

        if (!hasIndexFile) {
            return null;
        }

        return `
        import pluginInit_${index} from "${context.rootContext}/sakke-plugins/${dir}/index.js";
        if (typeof pluginInit_${index} !== "function") {
            throw new Error("Sakke Plugin missing default function export in: " + __filename);
        }
        if (document.body.classList.contains("sp-${dir}")) {
           pluginInit_${index}();
        }
        `;
    };

    const indexFiles = await Promise.all(
        sakke.plugins.map((dir, index) => {
            // If sakke-plugin is defined as simple string, use it as name of sakke-plugin
            // Otherwise get sakke-plugin name from 'name'-property
            dir = typeof dir === "string" ? dir : dir.name;
            return getImportStament(dir, index);
        }),
    );

    for (const indexFile of indexFiles) {
        if (!indexFile) {
            continue;
        }
        source = indexFile + "\n" + source;
    }

    return source;
}

const sakkeLoaderRule = {
    test: (modulePath) => {
        return (
            PathUtils.join(process.cwd(), "assets/scripts/main.js") ===
            modulePath
        );
    },

    use: [
        {
            // Loader must be given as strings. Webpack reads the loader from
            // the default export of this file.
            loader: __filename,
        },
    ],
};

/**
 * Convert async-function to callback based webpack loader. This ensures all
 * errors are properly passed to webpack.
 * https://webpack.js.org/api/loaders/#asynchronous-loaders
 */
function asAsyncWebpackLoader(fn) {
    // Must _not_ use arrow function here to be able to get the correct "this" value
    return function asyncWebpackLoaderAdapter(source) {
        const callback = this.async();
        fn(this, source).then(
            (transformed) => {
                callback(null, transformed);
            },
            (error) => {
                callback(error);
            },
        );
    };
}

// Export the loader as the "default export" and rule as named
module.exports = Object.assign(asAsyncWebpackLoader(sakkeLoader), {
    sakkeLoaderRule,
    isFile,
});
