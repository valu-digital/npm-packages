import crypto from "crypto";

import { promises as fs } from "fs";
import PathUtils from "path";
import {
    parse,
    print,
    FragmentDefinitionNode,
    visit,
    OperationDefinitionNode,
} from "graphql";
import { ParsedGQLTag, combinedIds } from "./shared";

export function debug(...args: any[]) {
    if (process.env.BABEL_GQL_DEBUG) {
        console.log("[babel-gql]", ...args);
    }
}

function hash(s: string) {
    return crypto
        .createHash("sha256")
        .update(s, "utf8")
        .digest()
        .toString("hex");
}

export function findUsedFragments(
    operation: OperationDefinitionNode | FragmentDefinitionNode,
    knownFragments: ReadonlyMap<string, FragmentDefinitionNode>,
    _usedFragments?: Map<string, FragmentDefinitionNode>,
) {
    const usedFragments = _usedFragments
        ? _usedFragments
        : new Map<string, FragmentDefinitionNode>();

    visit(operation, {
        FragmentSpread: {
            enter(node) {
                const frag = knownFragments.get(node.name.value);
                if (frag) {
                    usedFragments.set(node.name.value, frag);
                    findUsedFragments(frag, knownFragments, usedFragments);
                } else {
                    throw new Error("Unknown fragment: " + node.name.value);
                }
            },
        },
    });

    return usedFragments;
}
function isOperationDefinition(ob: any): ob is OperationDefinitionNode {
    return Boolean(ob && ob.kind === "OperationDefinition");
}

function isFragmentDefinition(ob: any): ob is FragmentDefinitionNode {
    return Boolean(ob && ob.kind === "FragmentDefinition");
}

interface OnDone {
    (qm: QueryManager, modifiedQueryCount: number): Promise<any>;
}

export class BabelGQLWebpackPlugin {
    target: string;
    onDone?: OnDone;

    constructor(options: { target: string; onDone?: OnDone }) {
        debug("Initializing Webpack plugin");
        if (!options.target) {
            throw new Error("No target passed to QueryManagerWebpackPlugin");
        }

        this.target = options.target;
        this.onDone = options.onDone;
    }

    apply(compiler: any) {
        debug("Applying Webpack compiler");
        compiler.hooks.afterCompile.tapPromise(
            "BabelGQLWebpackPlugin",
            async () => {
                debug("Webpack 'afterCompile'");
                await this.handleDone();
            },
        );
    }

    async handleDone() {
        const qm = QueryManager.getRegisteredGlobal();

        await fs.mkdir(this.target, { recursive: true });

        const dirtyQueries = qm.popDirtyQueries();

        await Promise.all(
            dirtyQueries.map(async query => {
                const path = PathUtils.join(
                    this.target,
                    `${query.queryName}-${query.fullQueryId}.graphql`,
                );

                await fs.writeFile(path, query.fullQuery);

                debug(`Wrote ${path}`);
            }),
        );

        if (this.onDone) {
            await this.onDone(qm, dirtyQueries.length);
        }
    }
}

/**
 * In memory presentation of GraphQL queries that appear in the code
 */
export class QueryManager {
    /**
     * Queries by name
     */
    knownQueries = new Map<string, string | undefined>();

    /**
     * Fragments by name
     */
    knownFragments = new Map<string, string | undefined>();

    /**
     * Fragments by query name
     */
    fragmentsUsedByQuery = new Map<string, Set<string> | undefined>();

    /**
     * Fragments by fragment name
     */
    fragmentsUsedByFragment = new Map<string, Set<string> | undefined>();

    dirtyQueries = new Set<string>();

    static getRegisteredGlobal(): QueryManager {
        const anyGlobal = global as any;

        if (!anyGlobal.QueryManagerGlobal) {
            throw new Error("No global QueryManager registered (babel-gql)");
        }

        return anyGlobal.QueryManagerGlobal;
    }

    registerAsGlobal() {
        const anyGlobal = global as any;
        if (anyGlobal.QueryManagerGlobal) {
            throw new Error(
                "There's already a global QueryManager defined (babel-gql)",
            );
        }
        anyGlobal.QueryManagerGlobal = this;
    }

    parseGraphQL(graphql: string): ParsedGQLTag {
        const doc = parse(graphql);

        const queries = [] as string[];

        const fragments = [] as string[];

        visit(doc, {
            OperationDefinition: def => {
                if (!def.name) {
                    throw new Error("OperationDefinition missing name");
                }

                const queryName = def.name.value;

                const query = print(def).trim();

                queries.push(queryName);

                if (this.knownQueries.get(queryName) === query) {
                    // no changes
                    return;
                }

                this.dirtyQueries.add(queryName);
                this.knownQueries.set(queryName, query);
                this.fragmentsUsedByQuery.set(queryName, new Set());
            },
            FragmentDefinition: def => {
                const fragmentName = def.name.value;
                const fragment = print(def).trim();

                fragments.push(fragmentName);
                if (this.knownFragments.get(fragmentName) === fragment) {
                    // no changes
                    return;
                }

                this.knownFragments.set(fragmentName, fragment);
                this.fragmentsUsedByFragment.set(fragmentName, new Set());

                const relatedFragments = new Set<string>();
                relatedFragments.add(fragmentName);

                for (const [
                    relatedFragmentName,
                    usedFragmentNames,
                ] of this.fragmentsUsedByFragment.entries()) {
                    if (!usedFragmentNames) {
                        continue;
                    }
                    if (usedFragmentNames.has(fragmentName)) {
                        relatedFragments.add(relatedFragmentName);
                    }
                }

                for (const [
                    queryName,
                    usedFragmentNames,
                ] of this.fragmentsUsedByQuery.entries()) {
                    if (!usedFragmentNames) {
                        continue;
                    }

                    for (const usedFragmentName of usedFragmentNames) {
                        if (relatedFragments.has(usedFragmentName)) {
                            this.dirtyQueries.add(queryName);
                        }
                    }
                }
            },
            FragmentSpread: (node, key, parent, path, ancestors) => {
                const fragmentSpreadName = node.name.value;

                for (const a of ancestors) {
                    if (isFragmentDefinition(a)) {
                        const parentFragmentName = a.name.value;

                        let fragments = this.fragmentsUsedByFragment.get(
                            parentFragmentName,
                        );

                        if (!fragments) {
                            fragments = new Set();
                            this.fragmentsUsedByFragment.set(
                                parentFragmentName,
                                fragments,
                            );
                        }

                        fragments.add(fragmentSpreadName);
                    }

                    if (isOperationDefinition(a)) {
                        const queryName = a.name?.value;
                        if (!queryName) {
                            continue;
                        }

                        let fragments = this.fragmentsUsedByQuery.get(
                            queryName,
                        );

                        if (!fragments) {
                            fragments = new Set();
                            this.fragmentsUsedByQuery.set(queryName, fragments);
                        }

                        fragments.add(fragmentSpreadName);
                    }
                }
            },
        });

        return {
            queries: queries.map(queryName => {
                const query = this.knownQueries.get(queryName)!;

                return {
                    query,
                    queryName,
                    queryId: hash(query),
                    usedFragments: Array.from(
                        this.fragmentsUsedByQuery.get(queryName) ?? [],
                    ),
                };
            }),
            fragments: fragments.map(fragmentName => {
                const fragment = this.knownFragments.get(fragmentName)!;

                return {
                    fragment,
                    fragmentName,
                    fragmentId: hash(fragment),
                    usedFragments: Array.from(
                        this.fragmentsUsedByFragment.get(fragmentName) ?? [],
                    ),
                };
            }),
        };
    }

    queryHasRequiredFragments(queryName: string) {
        const usedFragments = this.getUsedFragmentNamesForQuery(queryName);

        for (const fragmentName of usedFragments) {
            if (!this.knownFragments.has(fragmentName)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get set of dirty queries that have all required fragments
     */
    popDirtyQueries() {
        const availableQueries = this.dirtyQueries;
        const popQueries = new Set<string>();
        this.dirtyQueries = new Set();

        for (const queryName of availableQueries) {
            if (this.queryHasRequiredFragments(queryName)) {
                popQueries.add(queryName);
            } else {
                this.dirtyQueries.add(queryName);
            }
        }

        return Array.from(popQueries)
            .map(queryName => {
                return this.exportQuery(queryName);
            })
            .filter(Boolean);
    }

    getQueries() {
        return Array.from(this.knownQueries.keys())
            .filter(queryName => this.queryHasRequiredFragments(queryName))
            .map(queryName => {
                return this.exportQuery(queryName);
            });
    }

    getUsedFragmentNamesForQuery(queryName: string) {
        const fragmentNames = new Set<string>();
        const usedFragments = this.fragmentsUsedByQuery.get(queryName);

        if (!usedFragments) {
            return fragmentNames;
        }

        for (const usedFragmentName of usedFragments) {
            fragmentNames.add(usedFragmentName);
            this.getNestedFragmentNamesForFragment(
                usedFragmentName,
                fragmentNames,
            );
        }

        return fragmentNames;
    }

    getNestedFragmentNamesForFragment(
        fragmentName: string,
        _fragments?: Set<string>,
    ) {
        const fragments = _fragments || new Set();
        const usedFragments = this.fragmentsUsedByFragment.get(fragmentName);

        if (usedFragments) {
            for (const usedFragmentName of usedFragments) {
                fragments.add(usedFragmentName);
                this.getNestedFragmentNamesForFragment(
                    usedFragmentName,
                    fragments,
                );
            }
        }

        return fragments;
    }

    exportQuery(queryName: string) {
        const query = this.knownQueries.get(queryName);

        if (!query) {
            throw new Error(`Unknown query ${queryName}`);
        }

        const fragments = Array.from(
            this.getUsedFragmentNamesForQuery(queryName),
        )
            .map(fragmentName => {
                const fragment = this.knownFragments.get(fragmentName)!;

                return {
                    fragment,
                    fragmentName,
                    fragmentId: hash(fragment),
                };
            })
            .sort((a, b) => {
                return a.fragmentName.localeCompare(b.fragmentName);
            });

        const fragmentIds = fragments.map(f => f.fragmentId);

        const fragmentsString = fragments.map(f => f.fragment).join("\n");

        const fullQuery = (fragmentsString + "\n" + query).trim();

        const queryId = hash(query);
        const fullQueryId = combinedIds([queryId, ...fragmentIds]);

        return {
            query,
            queryId,
            fullQueryId,
            fullQuery,
            usedFragments: fragments,
            queryName,
        };
    }
}
