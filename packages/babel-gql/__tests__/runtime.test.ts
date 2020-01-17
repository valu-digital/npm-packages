import { createRuntimeGQL } from "../src";
import dedent from "dedent";

test("runtime return value with babel", () => {
    const { runtimeGQL } = createRuntimeGQL();

    const query = runtimeGQL({
        queries: [
            {
                query: "",
                queryId: "123",
                queryName: "getTest",
                usedFragments: [],
            },
        ],
        fragments: [],
    });

    expect(query).toEqual({
        queries: [
            {
                query: "",
                queryId: "123",
                queryName: "getTest",
                usedFragments: [],
            },
        ],
        fragments: [],
    });
});

test("can register query callbacks", () => {
    const spy = jest.fn();
    const { runtimeGQL, registerGQLListener } = createRuntimeGQL();

    registerGQLListener(q => {
        spy(q);
    });

    runtimeGQL({
        queries: [
            {
                query: "",
                queryId: "123",
                queryName: "getTest",
                usedFragments: [],
            },
        ],
        fragments: [],
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith({
        fragments: [],
        queries: [
            {
                query: "",
                queryId: "123",
                queryName: "getTest",
                usedFragments: [],
            },
        ],
    });
});

test("can get query", () => {
    const { runtimeGQL, getQuery } = createRuntimeGQL();

    runtimeGQL({
        queries: [
            {
                query: "query getTest { foo }",
                queryId: "123",
                queryName: "getTest",
                usedFragments: [],
            },
        ],
        fragments: [],
    });

    expect(getQuery("getTest")).toEqual({
        query: "query getTest { foo }",
        queryId: "123",
        queryName: "getTest",
    });
});

test("can get query with fragments", () => {
    const { runtimeGQL, getQuery } = createRuntimeGQL();

    runtimeGQL({
        queries: [
            {
                query: "query getTest { field, ...NamedParts }",
                queryId: "123",
                queryName: "getTest",
                usedFragments: ["NamedParts"],
            },
        ],
        fragments: [
            {
                fragment: "fragment NamedPars on Person { field2 }",
                fragmentId: "abc",
                fragmentName: "NamedParts",
                usedFragments: [],
            },
        ],
    });

    expect(getQuery("getTest")).toMatchObject({
        queryId: "1a",
        queryName: "getTest",
    });

    expect(getQuery("getTest").query).toMatchSnapshot();
});

test("can get query with fragments depending on fragments", () => {
    const { runtimeGQL, getQuery } = createRuntimeGQL();

    runtimeGQL({
        queries: [
            {
                query: "",
                queryId: "123",
                queryName: "getTest",
                usedFragments: ["NamedParts"],
            },
        ],
        fragments: [
            {
                fragment: "",
                fragmentId: "abc",
                fragmentName: "NamedParts",
                usedFragments: ["OtherFragment"],
            },
            {
                fragment: "",
                fragmentId: "efg",
                fragmentName: "OtherFragment",
                usedFragments: [],
            },
        ],
    });

    expect(getQuery("getTest")).toMatchObject({
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
                fragment: "",
                fragmentId: "efg",
                fragmentName: "OtherFragment",
                usedFragments: [],
            },
        ],
    });

    runtimeGQL({
        queries: [
            {
                query: "",
                queryId: "123",
                queryName: "getTest",
                usedFragments: ["NamedParts"],
            },
        ],
        fragments: [
            {
                fragment: "",
                fragmentId: "abc",
                fragmentName: "NamedParts",
                usedFragments: ["OtherFragment"],
            },
        ],
    });

    expect(getQuery("getTest")).toMatchObject({
        queryId: "1ae",
        queryName: "getTest",
    });
});
