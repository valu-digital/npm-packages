import { ParsedGQLTag, combinedIds } from "./shared";

export function createRuntimeGQL() {
    const queries: Record<string, ParsedGQLTag["queries"][0] | undefined> = {};
    const fragments: Record<
        string,
        ParsedGQLTag["fragments"][0] | undefined
    > = {};

    function gql(
        literals: TemplateStringsArray,
        ...placeholders: string[]
    ): ParsedGQLTag {
        if (!Array.isArray(literals)) {
            // Was converted to a normal function call via babel
            return runtimeGQL(literals as any);
        }

        throw new Error("babel-gql not configured?");
    }

    function runtimeGQL(parsed: ParsedGQLTag) {
        parsed.queries.forEach(query => {
            queries[query.queryName] = query;
        });
        parsed.fragments.forEach(fragment => {
            fragments[fragment.fragmentName] = fragment;
        });

        return parsed;
    }

    function findFragmentsOfFragments(
        fragmentName: string,
        _frags: Record<string, boolean>,
    ): Record<string, boolean> {
        const fragment = fragments[fragmentName];

        if (!fragment) {
            throw new Error(`Cannot find fragment ${fragmentName}`);
        }

        if (!_frags) {
            _frags = {};
        }

        _frags[fragmentName] = true;

        fragment.usedFragments.forEach(fragmenName => {
            _frags[fragmenName] = true;
            findFragmentsOfFragments(fragmenName, _frags);
        });

        return _frags;
    }

    return {
        gql,
        runtimeGQL,
        getQuery(queryName: string) {
            const query = queries[queryName];

            if (!query) {
                throw new Error(`Cannot find query ${queryName}`);
            }

            const frags: Record<string, boolean> = {};

            query.usedFragments.forEach(fragmentName => {
                findFragmentsOfFragments(fragmentName, frags);
            });

            const usedFragments = Object.keys(frags).map(fragmentName => {
                const fragment = fragments[fragmentName];

                if (!fragment) {
                    throw new Error(
                        `Cannot find fragment ${fragmentName} for query ${queryName}`,
                    );
                }

                return fragment;
            });

            return {
                query: (
                    usedFragments.map(f => f.fragment).join("\n") +
                    "\n" +
                    query.query
                ).trim(),
                queryName: queryName,
                queryId: combinedIds([
                    query.queryId,
                    ...usedFragments.map(f => f.fragmentId),
                ]),
            };
        },
    };
}

function doRequest(
    endpoint: string,
    options: {
        query: {
            queryName: string;
            queryId: string;
            query: string;
        };
        variables?: object;
        fetchOptions?: RequestInit;
    },
) {
    if (process.env.NODE_ENV !== "production") {
        return fetch(endpoint, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                ...options.fetchOptions?.headers,
            },
            body: JSON.stringify({
                variables: options.variables,
                operationName: options.query.queryName,
                query: options.query.query,
            }),
        });
    }

    const params = new URLSearchParams();
    params.append("operationName", options.query.queryName);
    if (options.variables) {
        params.append("variables", JSON.stringify(options.variables));
    }

    params.append(
        "extensions",
        JSON.stringify({
            persistedQuery: {
                version: 1,
                sha256Hash: options.query.queryId,
            },
        }),
    );

    // XXX turn to POST if mutation
    return fetch(endpoint + "?" + params.toString(), options.fetchOptions);
}

export function request<ResponseType = any>(
    endpoint: string,
    options: {
        query: string | ParsedGQLTag;
        variables?: object;
        fetchOptions?: RequestInit;
    },
): Promise<{
    response: Response;
    errors?: any[];
    data: ResponseType;
}> {
    const query = options.query;

    if (typeof query !== "string") {
        if (query.queries.length === 0) {
            throw new Error("Cannot find graphql query from tag");
        }

        if (query.queries.length > 1) {
            console.warn(
                "Multiple queries defined in request query " +
                    query.queries.map(q => q.queryName).join(", "),
            );
        }
    }

    let promise;

    if (typeof query === "string") {
        promise = doRequest(endpoint, {
            query: getQuery(query),
            variables: options.variables,
            fetchOptions: options.fetchOptions,
        });
    } else {
        const queryOb = query.queries[0];
        promise = doRequest(endpoint, {
            query: getQuery(queryOb.queryName),
            variables: options.variables,
            fetchOptions: options.fetchOptions,
        });
    }

    let response: Response;
    return promise
        .then(res => {
            response = res;
            return res.json();
        })
        .then(data => {
            if (data.errors?.length ?? 0 > 0) {
                data.errors.forEach((error: any) => {
                    console.error(
                        "GraphQL response error:",
                        error.message,
                        error,
                    );
                });
            }
            data.response = response;
            return data;
        });
}

const babelqgl = createRuntimeGQL();

export const gql = babelqgl.gql;
export const getQuery = babelqgl.getQuery;
