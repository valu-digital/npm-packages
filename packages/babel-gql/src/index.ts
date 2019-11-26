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
    ): ParsedGQLTag | { babel: false; query: string } {
        if (!Array.isArray(literals)) {
            return runtimeGQL(literals as any);
        }

        let result = "";

        // interleave the literals with the placeholders
        for (let i = 0; i < placeholders.length; i++) {
            result += literals[i];
            result += placeholders[i];
        }

        // add the last literal
        result += literals[literals.length - 1];

        return { babel: false as const, query: result };
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

            const fragmentIds = Object.keys(frags).map(fragmentName => {
                const fragment = fragments[fragmentName];

                if (!fragment) {
                    throw new Error(
                        `Cannot find fragment ${fragmentName} for query ${queryName}`,
                    );
                }

                return fragment.fragmentId;
            });

            return {
                queryName: queryName,
                queryId: combinedIds([query.queryId, ...fragmentIds]),
            };
        },
    };
}
