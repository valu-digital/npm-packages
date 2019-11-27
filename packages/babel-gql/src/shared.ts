export interface ParsedGQLTag {
    queries: {
        query: string;
        queryName: string;
        queryId: string;
        usedFragments: string[];
    }[];
    fragments: {
        fragment: string;
        fragmentName: string;
        fragmentId: string;
        usedFragments: string[];
    }[];
}

export function combinedIds(ids: string[]) {
    const [first, ...rest] = ids;

    if (rest.length === 0) {
        return first;
    }

    const chunkSize = Math.floor(first.length / ids.length);

    return (
        first.slice(0, chunkSize) +
        rest
            .sort()
            .map(id => id.slice(0, chunkSize))
            .join("")
    );
}
