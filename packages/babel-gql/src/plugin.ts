import { promises as fs } from "fs";
import PathUtils from "path";
import * as _BabelTypes from "@babel/types";
import { Visitor, NodePath } from "@babel/traverse";
import { QueryManager } from "./query-manager";
import { combinedIds } from "./shared";

type BabelTypes = typeof _BabelTypes;

export interface Babel {
    types: BabelTypes;
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
    active?: boolean;
    target?: string;
}

function isActive(state: VisitorState) {
    const defaultValue = Boolean(process.env.NODE_ENV === "production");

    return state.opts?.active ?? defaultValue;
}

interface VisitorState {
    opts?: BabelGQLOptions;
    file: BabelFile;
}

export default function bemedBabelPlugin(
    babel: Babel,
): { visitor: Visitor<VisitorState> } {
    const t = babel.types;

    const qm = new QueryManager({
        async onExportQuery(query, target) {
            if (!target) {
                return;
            }

            await fs.mkdir(target, { recursive: true });

            const fragmentIds = query.usedFragments.map(f => f.fragmentId);
            const fragments = query.usedFragments
                .map(f => f.fragment)
                .join("\n");

            const finalQueryId = combinedIds([query.queryId, ...fragmentIds]);

            const fullQuery = (fragments + "\n" + query.query).trim();

            await fs.writeFile(
                PathUtils.join(
                    target,

                    `${query.queryName}-${finalQueryId}.graphql`,
                ),
                fullQuery,
            );
        },
    });

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
                if (!isActive(state)) {
                    return;
                }

                if (!name) {
                    return;
                }

                if (!t.isIdentifier(path.node.tag, { name })) {
                    return;
                }

                if (!path.node.loc) {
                    return;
                }

                const gqlString = path.node.quasi.quasis
                    .map(q => q.value.cooked)
                    .join("")
                    .trim();

                const parsed = qm.parseGraphQL(gqlString);

                path.replaceWith(
                    t.callExpression(t.identifier(name), [
                        recursiveObjectExpression(t, {
                            queries: parsed.queries.map(query => ({
                                queryName: query.queryName,
                                queryId: query.queryId,
                                usedFragments: query.usedFragments,
                            })),
                            fragments: parsed.fragments.map(fragment => ({
                                fragmentName: fragment.fragmentName,
                                fragmentId: fragment.fragmentId,
                                usedFragments: fragment.usedFragments,
                            })),
                        }),
                    ]),
                );

                qm.exportDirtyQueries(
                    state.opts?.target ??
                        PathUtils.join(process.cwd(), ".queries"),
                );
            },
        },
    };
}

function recursiveObjectExpression(t: BabelTypes, ob: any): any {
    if (typeof ob === "string") {
        return t.stringLiteral(ob);
    }

    if (typeof ob === "boolean") {
        return t.booleanLiteral(ob);
    }

    if (Array.isArray(ob)) {
        return t.arrayExpression(
            ob.map(item => recursiveObjectExpression(t, item)),
        );
    }

    if (typeof ob === "number") {
        return t.numericLiteral(ob);
    }

    if (!ob) {
        return t.nullLiteral();
    }

    return t.objectExpression(
        Object.keys(ob)
            .sort()
            .map(key => {
                return t.objectProperty(
                    t.identifier(key),
                    recursiveObjectExpression(t, ob[key]),
                );
            }),
    );
}
