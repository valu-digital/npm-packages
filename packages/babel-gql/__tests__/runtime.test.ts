import { createRuntimeGQL } from "../src";
import dedent from "dedent";

test("usage without babel", () => {
    const { gql } = createRuntimeGQL();

    const query = gql`
        query getFoo {
            foo
        }
    `;

    if (query.babel) {
        throw new Error("no babel here");
    }

    expect(dedent(query.query)).toEqual(dedent`
        query getFoo {
            foo
        }
    `);
});

test("runtime return value with babel", () => {
    const { runtimeGQL } = createRuntimeGQL();

    const query = runtimeGQL({
        queries: [{ queryId: "123", queryName: "getTest", usedFragments: [] }],
        fragments: [],
    });

    expect(query).toEqual({
        babel: true,
        queries: [{ queryId: "123", queryName: "getTest", usedFragments: [] }],
        fragments: [],
    });
});

test("can get query", () => {
    const { runtimeGQL, getQuery } = createRuntimeGQL();

    runtimeGQL({
        queries: [{ queryId: "123", queryName: "getTest", usedFragments: [] }],
        fragments: [],
    });

    expect(getQuery("getTest")).toEqual({
        queryId: "123",
        queryName: "getTest",
    });
});

test("can get query with fragments", () => {
    const { runtimeGQL, getQuery } = createRuntimeGQL();

    runtimeGQL({
        queries: [
            {
                queryId: "123",
                queryName: "getTest",
                usedFragments: ["NamedParts"],
            },
        ],
        fragments: [
            {
                fragmentId: "abc",
                fragmentName: "NamedParts",
                usedFragments: [],
            },
        ],
    });

    expect(getQuery("getTest")).toEqual({
        queryId: "1a",
        queryName: "getTest",
    });
});

test("can get query with fragments depending on fragments", () => {
    const { runtimeGQL, getQuery } = createRuntimeGQL();

    runtimeGQL({
        queries: [
            {
                queryId: "123",
                queryName: "getTest",
                usedFragments: ["NamedParts"],
            },
        ],
        fragments: [
            {
                fragmentId: "abc",
                fragmentName: "NamedParts",
                usedFragments: ["OtherFragment"],
            },
            {
                fragmentId: "efg",
                fragmentName: "OtherFragment",
                usedFragments: [],
            },
        ],
    });

    expect(getQuery("getTest")).toEqual({
        queryId: "1ae",
        queryName: "getTest",
    });
});

test("can use multiple runtime calls", () => {
    const { runtimeGQL, getQuery } = createRuntimeGQL();

    runtimeGQL({
        queries: [],
        fragments: [
            {
                fragmentId: "efg",
                fragmentName: "OtherFragment",
                usedFragments: [],
            },
        ],
    });

    runtimeGQL({
        queries: [
            {
                queryId: "123",
                queryName: "getTest",
                usedFragments: ["NamedParts"],
            },
        ],
        fragments: [
            {
                fragmentId: "abc",
                fragmentName: "NamedParts",
                usedFragments: ["OtherFragment"],
            },
        ],
    });

    expect(getQuery("getTest")).toEqual({
        queryId: "1ae",
        queryName: "getTest",
    });
});
