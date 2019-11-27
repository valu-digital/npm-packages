import { promises as fs } from "fs";
import PathUtils from "path";
import * as BabelTypes from "@babel/types";
import { Visitor, NodePath } from "@babel/traverse";
import { QueryManager } from "./query-manager";

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
    ownModuleName?: string;
    export?: boolean;
    removeQuery?: boolean;
    target?: string;
}

interface VisitorState {
    opts?: BabelGQLOptions;
    file: BabelFile;
}

function parseTag(
    t: typeof BabelTypes,
    qm: QueryManager,
    path: NodePath<BabelTypes.TaggedTemplateExpression>,
    removeQuery: boolean,
) {
    const gqlString = path.node.quasi.quasis
        .map(q => q.value.cooked)
        .join("")
        .trim();

    let parsed;

    try {
        parsed = qm.parseGraphQL(gqlString);
    } catch (error) {
        throw path.buildCodeFrameError(
            "GraphQL: " + error.message ?? "Unknown graphql parsing error",
        );
    }

    return recursiveObjectExpression(t, {
        queries: parsed.queries.map(query => ({
            query: removeQuery ? "" : query.query,
            queryName: query.queryName,
            queryId: query.queryId,
            usedFragments: query.usedFragments,
        })),
        fragments: parsed.fragments.map(fragment => ({
            fragment: removeQuery ? "" : fragment.fragment,
            fragmentName: fragment.fragmentName,
            fragmentId: fragment.fragmentId,
            usedFragments: fragment.usedFragments,
        })),
    });
}

const externalModules: {
    name: string;
    identifier?: string;
}[] = [
    {
        // import gql from 'graphql-tag'
        name: "graphql-tag",
    },
    {
        name: "graphql-tag.macro",
    },
    {
        // import { graphql } from 'gatsby'
        name: "gatsby",
        identifier: "graphql",
    },
    {
        name: "apollo-server-express",
        identifier: "gql",
    },
    {
        name: "apollo-server",
        identifier: "gql",
    },
    {
        name: "react-relay",
        identifier: "graphql",
    },
    {
        name: "apollo-boost",
        identifier: "gql",
    },
    {
        name: "apollo-server-koa",
        identifier: "gql",
    },
    {
        name: "apollo-server-hapi",
        identifier: "gql",
    },
    {
        name: "apollo-server-fastify",
        identifier: "gql",
    },
    {
        name: " apollo-server-lambda",
        identifier: "gql",
    },
    {
        name: "apollo-server-micro",
        identifier: "gql",
    },
    {
        name: "apollo-server-azure-functions",
        identifier: "gql",
    },
    {
        name: "apollo-server-cloud-functions",
        identifier: "gql",
    },
    {
        name: "apollo-server-cloudflare",
        identifier: "gql",
    },
];

function findIdentifier(importName: string) {
    return externalModules.find(m => m.name === importName);
}

export default function bemedBabelPlugin(
    babel: Babel,
): { visitor: Visitor<VisitorState> } {
    const t = babel.types;
    const isProduction = Boolean(process.env.NODE_ENV === "production");

    const qm = new QueryManager({
        async onExportQuery(query, target) {
            if (!target) {
                return;
            }

            await fs.mkdir(target, { recursive: true });

            await fs.writeFile(
                PathUtils.join(
                    target,
                    `${query.queryName}-${query.fullQueryId}.graphql`,
                ),
                query.fullQuery,
            );
        },
    });

    /**
     * Local name of the css import from babel-gql if any
     */
    let ourName: string | null = null;
    let externalTags = new Set<string>();
    let inject: any[] = [];

    return {
        visitor: {
            Program: {
                enter(path) {
                    // Reset import name state when entering a new file
                    ourName = null;
                    inject = [];
                    externalTags = new Set();
                },

                exit(path, state) {
                    if (!ourName) {
                        return;
                    }

                    for (const graphqObject of inject) {
                        path.pushContainer(
                            "body",
                            t.callExpression(t.identifier(ourName), [
                                graphqObject,
                            ]),
                        );
                    }
                },
            },

            ImportDeclaration(path, state) {
                const opts = state.opts || {};

                const target = opts?.ownModuleName ?? "babel-gql";
                const importName = path.node.source.value;

                if (importName === target) {
                    for (const s of path.node.specifiers) {
                        if (!t.isImportSpecifier(s)) {
                            continue;
                        }

                        if (s.imported.name === "gql") {
                            ourName = s.local.name;
                        }
                    }
                }

                const external = findIdentifier(importName);

                if (external) {
                    for (const s of path.node.specifiers) {
                        if (!t.isImportSpecifier(s)) {
                            continue;
                        }

                        if (
                            external.identifier &&
                            s.imported.name === external.identifier
                        ) {
                            externalTags.add(s.local.name);
                        }
                    }
                }
            },

            TaggedTemplateExpression(path, state) {
                if (!path.node.loc) {
                    return;
                }

                const tag = path.node.tag;

                if (!t.isIdentifier(tag)) {
                    return;
                }

                const removeQuery = state.opts?.removeQuery ?? isProduction;

                if (ourName && tag.name === ourName) {
                    const graphqObject = parseTag(t, qm, path, removeQuery);

                    path.replaceWith(
                        t.callExpression(t.identifier(ourName), [graphqObject]),
                    );
                } else if (externalTags.has(tag.name)) {
                    if (inject) {
                        inject.push(parseTag(t, qm, path, removeQuery));
                    }
                }

                const shouldExport = state.opts?.export ?? isProduction;

                if (shouldExport) {
                    qm.exportDirtyQueries(
                        state.opts?.target ??
                            PathUtils.join(process.cwd(), ".queries"),
                    );
                }
            },
        },
    };
}

function recursiveObjectExpression(t: typeof BabelTypes, ob: any): any {
    if (typeof ob === "string") {
        return t.stringLiteral(ob);
    }

    if (typeof ob === "boolean") {
        return t.booleanLiteral(ob);
    }

    if (ob === null) {
        return t.nullLiteral();
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
