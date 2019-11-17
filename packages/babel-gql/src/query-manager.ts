import {
    parse,
    print,
    FragmentDefinitionNode,
    DocumentNode,
    visit,
    OperationDefinitionNode,
    isOutputType,
} from "graphql";

function findFragmentDefinitions(
    docs: (DocumentNode | FragmentDefinitionNode)[],
) {
    const fragments = new Map<string, FragmentDefinitionNode>();

    for (const doc of docs) {
        visit(doc, {
            FragmentDefinition: {
                enter(node) {
                    fragments.set(node.name.value, node);
                },
            },
        });
    }

    return fragments;
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

export interface QueryManagerOptions {
    onExportQuery(
        query: {
            query: string;
            fragments: string[];
        },
        queryManager: QueryManager,
    ): Promise<any>;
}

interface QueryData {
    query: string;
    queryId: string;
    queryName: string;
    requiredFragments: string[];
}

function isOperationDefinition(ob: any): ob is OperationDefinitionNode {
    return Boolean(ob && ob.kind === "OperationDefinition");
}

/**
 * In memory presentation of GraphQL queries that appear in the code
 */
export class QueryManager {
    queries = new Map<string, string | undefined>();
    fragments = new Map<string, string | undefined>();
    queryDeps = new Map<string, Set<string> | undefined>();
    fragmentDeps = new Map<string, Set<string> | undefined>();
    dirtyQueries = new Set<string>();

    options: QueryManagerOptions;

    constructor(options: QueryManagerOptions) {
        this.options = options;
    }

    parseGraphQL(graphql: string) {
        const doc = parse(graphql);

        visit(doc, {
            OperationDefinition: def => {
                if (!def.name) {
                    throw new Error("OperationDefinition missing name");
                }

                this.dirtyQueries.add(def.name.value);
                this.queries.set(def.name.value, print(def).trim());
                this.queryDeps.set(def.name.value, new Set());
            },
            FragmentDefinition: def => {
                this.fragments.set(def.name.value, print(def).trim());
                this.fragmentDeps.set(def.name.value, new Set());

                for (const [
                    queryName,
                    fragmentNames,
                ] of this.queryDeps.entries()) {
                    if (!fragmentNames) {
                        continue;
                    }

                    for (const fragmentName of fragmentNames) {
                        if (fragmentName === def.name.value) {
                            this.dirtyQueries.add(queryName);
                        }
                    }
                }
            },
            FragmentSpread: (node, key, parent, path, ancestors) => {
                for (const a of ancestors) {
                    if (isOperationDefinition(a)) {
                        const queryName = a.name?.value;
                        if (!queryName) {
                            continue;
                        }

                        const deps = this.queryDeps.get(queryName);
                        if (!deps) {
                            continue;
                        }

                        deps.add(node.name.value);
                    }
                }
            },
        });
    }

    addQuery(name: string, query: string) {}

    addFragment(name: string, fragment: string) {}

    // hasRequiredFragments(queryName: string) {
    //     const query = this.queries.get(queryName);
    //     if (!query) {
    //         return false;
    //     }

    //     return query.requiredFragments.every(fragmentName =>
    //         this.fragments.has(fragmentName),
    //     );
    // }

    formatQuery(query: QueryData) {
        const fragments = query.requiredFragments
            .map(fragmentName => this.fragments.get(fragmentName))
            .join("\n");

        return `${fragments}\n${query.query}`;
    }

    async exportDirtyQueries() {
        const queries = this.dirtyQueries;
        this.dirtyQueries = new Set();
        for (const queryName of queries) {
            await this.exportQuery(queryName);
        }
    }

    async exportQuery(queryName: string) {
        // if (!this.hasRequiredFragments(queryName)) {
        //     return;
        // }

        const query = this.queries.get(queryName);

        if (!query) {
            return;
        }

        const fragments = Array.from(this.queryDeps.get(queryName) ?? []).map(
            fragmentName => {
                return this.fragments.get(fragmentName)!;
            },
        );

        await this.options.onExportQuery(
            {
                query,
                fragments,
                // query: this.formatQuery(query),
                // queryId: query.queryId,
                // queryName: query.queryName,
            },
            this,
        );
    }
}
