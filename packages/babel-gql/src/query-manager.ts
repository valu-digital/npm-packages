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

function isFragmentDefinition(ob: any): ob is FragmentDefinitionNode {
    return Boolean(ob && ob.kind === "FragmentDefinition");
}

/**
 * In memory presentation of GraphQL queries that appear in the code
 */
export class QueryManager {
    queries = new Map<string, string | undefined>();
    knownFragments = new Map<string, string | undefined>();
    fragmentsUsedByQuery = new Map<string, Set<string> | undefined>();
    fragmentsUsedByFragment = new Map<string, Set<string> | undefined>();
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
                const fragmentName = def.name.value;
                this.knownFragments.set(fragmentName, print(def).trim());
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

        return popQueries;
    }

    async exportDirtyQueries() {
        for (const queryName of this.popDirtyQueries()) {
            await this.exportQuery(queryName);
        }
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

    async exportQuery(queryName: string) {
        // if (!this.hasRequiredFragments(queryName)) {
        //     return;
        // }

        const query = this.queries.get(queryName);

        if (!query) {
            return;
        }

        const fragments = Array.from(
            this.getUsedFragmentNamesForQuery(queryName),
        )
            .map(fragmentName => {
                return this.knownFragments.get(fragmentName)!;
            })
            .sort();

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
