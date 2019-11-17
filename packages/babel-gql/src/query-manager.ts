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
    knownFragments = new Map<string, string | undefined>();
    fragmentsUsedByQuery = new Map<string, Set<string> | undefined>();
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
                this.fragmentsUsedByQuery.set(def.name.value, new Set());
            },
            FragmentDefinition: def => {
                this.knownFragments.set(def.name.value, print(def).trim());
                this.fragmentDeps.set(def.name.value, new Set());

                for (const [
                    queryName,
                    fragmentNames,
                ] of this.fragmentsUsedByQuery.entries()) {
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

                        const deps = this.fragmentsUsedByQuery.get(queryName);
                        if (!deps) {
                            continue;
                        }

                        deps.add(node.name.value);
                    }
                }
            },
        });
    }

    popDirtyQueries() {
        const availableQueries = this.dirtyQueries;
        const popQueries = new Set<string>();
        this.dirtyQueries = new Set();

        for (const query of availableQueries) {
            const usedFragments = this.fragmentsUsedByQuery.get(query);
            if (!usedFragments) {
                // Does not use fragments, all good
                popQueries.add(query);
                continue;
            }

            for (const fragment of usedFragments) {
                if (!this.knownFragments.has(fragment)) {
                    // put it back if even one used fragment is missing
                    this.dirtyQueries.add(query);
                    continue;
                }
            }

            // All dep available
            if (!this.dirtyQueries.has(query)) {
                popQueries.add(query);
            }
        }

        return popQueries;
    }

    async exportDirtyQueries() {
        for (const queryName of this.popDirtyQueries()) {
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

        const fragments = Array.from(
            this.fragmentsUsedByQuery.get(queryName) ?? [],
        ).map(fragmentName => {
            return this.knownFragments.get(fragmentName)!;
        });

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
