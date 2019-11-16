export interface QueryManagerOptions {
    onWriteQueryFile(query: {
        query: string;
        queryName: string;
        queryId: string;
    }): Promise<any>;
}

interface QueryData {
    query: string;
    queryId: string;
    queryName: string;
    requiredFragments: string[];
}

/**
 * In memory presentation of GraphQL queries that appear in the code
 */
export class QueryManager {
    queries = new Map<string, QueryData | undefined>();

    fragments = new Map<
        string,
        | {
              fragment: string;
              usedByQueries: Set<string>;
          }
        | undefined
    >();

    options: QueryManagerOptions;

    constructor(options: QueryManagerOptions) {
        this.options = options;
    }

    parseGQLTag(quasi: string) {}

    addQuery(query: string) {}

    addFragment(fragment: string) {}

    hasRequiredFragments(queryName: string) {
        const query = this.queries.get(queryName);
        if (!query) {
            return false;
        }

        return query.requiredFragments.every(fragmentName =>
            this.fragments.has(fragmentName),
        );
    }

    formatQuery(query: QueryData) {
        const fragments = query.requiredFragments
            .map(fragmentName => this.fragments.get(fragmentName))
            .join("\n");

        return `${fragments}\n${query.query}`;
    }

    async writeQueryFile(queryName: string) {
        if (!this.hasRequiredFragments(queryName)) {
            return;
        }

        const query = this.queries.get(queryName);

        if (!query) {
            return;
        }

        await this.options.onWriteQueryFile({
            query: this.formatQuery(query),
            queryId: query.queryId,
            queryName: query.queryName,
        });
    }
}
