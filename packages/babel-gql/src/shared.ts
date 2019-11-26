export interface ParsedGQLTag {
    babel: true;
    queries: {
        queryName: string;
        queryId: string;
        usedFragments: string[];
    }[];
    fragments: {
        fragmentName: string;
        fragmentId: string;
        usedFragments: string[];
    }[];
}

export function combinedIds(ids: string[]) {
    return ids.join("");
}
