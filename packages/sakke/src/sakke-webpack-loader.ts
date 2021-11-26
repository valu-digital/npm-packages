import PathUtils from "path";
import dedent from "dedent";
import { SakkeConfig, SakkeJSONType } from "./types";
import { isFile, loadSakkeJSON } from "./utils";

// typescript porting todo
type TODO = any;

/**
 * Generate imports for the given sakke plugin js entry file
 */
async function generateImports(
    sakke: SakkeJSONType,
    entry: "index" | "admin" | "gutenberg",
) {
    if (!sakke.plugins || sakke.plugins.length === 0) {
        return "";
    }

    const entryFiles = await Promise.all(
        sakke.plugins.map(async (plugin, index) => {
            // If sakke-plugin is defined as a simple string, use it as name of
            // sakke-plugin Otherwise get sakke-plugin name from 'name'-property
            const pluginName =
                typeof plugin === "string" ? plugin : plugin.name;

            const hasFile = await isFile(
                `${process.cwd()}/sakke-plugins/${pluginName}/${entry}.js`,
            );

            if (!hasFile) {
                return "";
            }

            const importPath = `sakke-plugins/${pluginName}/${entry}.js`;

            return dedent`
                import pluginInit_${index} from "../../${importPath}";
                if (typeof pluginInit_${index} !== "function") {
                    throw new Error("Sakke Plugin missing default function export in: ${importPath}");
                }
                if (document.body.classList.contains("sp-${pluginName}")) {
                    pluginInit_${index}();
                }
            `.trim();
        }),
    );

    return entryFiles.filter(Boolean).join("\n");
}

// TODO we could probably import the real type from somewhere
interface WebpackContext {
    resourcePath?: string;
}

async function sakkeLoader(context: WebpackContext, source: string) {
    const sakke = await loadSakkeJSON();

    const path = context.resourcePath ?? "";

    if (path.endsWith("assets/scripts/main.js")) {
        source += await generateImports(sakke, "index");
    } else if (path.endsWith("assets/scripts/main-admin.js")) {
        source += await generateImports(sakke, "admin");
    } else if (path.endsWith("assets/scripts/gutenberg-admin.js")) {
        source += await generateImports(sakke, "gutenberg");
    } else {
        console.warn(
            "[sakke-webpack-loader] 🛑 Invalid resource passed to the loader function: " +
                context.resourcePath,
        );
    }

    return source;
}

export const sakkeLoaderRule = {
    // When loading assets/scripts/main.js, assets/scripts/main-admin.js or
    // assets/scripts/gutenberg-admin.js
    test: (modulePath: string) => {
        return ["main.js", "main-admin.js", "gutenberg-admin.js"].some(
            (entry) =>
                PathUtils.join(process.cwd(), "assets/scripts/" + entry) ===
                modulePath,
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

interface WebpackCallback {
    (...args: TODO[]): Promise<TODO>;
}

/**
 * Convert async-function to callback based webpack loader. This ensures all
 * errors are properly passed to webpack.
 * https://webpack.js.org/api/loaders/#asynchronous-loaders
 */
function asAsyncWebpackLoader(fn: WebpackCallback) {
    // Must _not_ use arrow function here to be able to get the correct "this" value
    return function asyncWebpackLoaderAdapter(this: TODO, source: string) {
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

export default asAsyncWebpackLoader(sakkeLoader);
