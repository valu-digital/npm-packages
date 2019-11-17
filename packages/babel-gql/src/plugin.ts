import * as BabelTypes from "@babel/types";
import { Visitor, NodePath } from "@babel/traverse";

export interface Babel {
    types: typeof BabelTypes;
}

interface BabelFile {
    opts: {
        generatorOpts: any;
    };
    code: string;
    path: NodePath;
}

export interface BabelGQLOptions {
    moduleName?: string;
    removeQuery?: boolean;
}

interface VisitorState {
    opts?: BabelGQLOptions;
    file: BabelFile;
}

export default function bemedBabelPlugin(
    babel: Babel,
): { visitor: Visitor<VisitorState> } {
    const t = babel.types;
    console.log("creati plugin instance");

    /**
     * Local name of the css import from babel-gql if any
     */
    let name: string | null = null;

    return {
        visitor: {
            Program() {
                // Reset import name state when entering a new file
                name = null;
            },

            ImportDeclaration(path, state) {
                const opts = state.opts || {};

                const target = opts?.moduleName ?? "babel-gql";

                if (path.node.source.value !== target) {
                    return;
                }

                for (const s of path.node.specifiers) {
                    if (!t.isImportSpecifier(s)) {
                        continue;
                    }

                    if (s.imported.name === "gql") {
                        name = s.local.name;
                    }
                }
            },

            TaggedTemplateExpression(path, state) {
                if (!name) {
                    return;
                }

                if (!t.isIdentifier(path.node.tag, { name })) {
                    return;
                }

                if (!path.node.loc) {
                    return;
                }

                path.replaceWith(
                    t.callExpression(t.identifier(name), [
                        t.objectExpression([
                            t.objectProperty(
                                t.identifier("queryName"),
                                t.stringLiteral("sdf"),
                            ),
                            t.objectProperty(
                                t.identifier("query"),
                                path.node.quasi,
                            ),
                        ]),
                    ]),
                );
            },
        },
    };
}
