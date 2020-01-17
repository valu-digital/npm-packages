import nock from "nock";
import { gql, request } from "../src";
import { ParsedGQLTag } from "../src/shared";

function runtimeGQL(parsed: ParsedGQLTag) {
    return (gql as any)(parsed);
}

beforeEach(async () => {
    nock.cleanAll();
});

const getPostsQuery = runtimeGQL({
    queries: [
        {
            query: "",
            queryName: "TestQuery",
            queryId: "1",
            usedFragments: [],
        },
    ],
    fragments: [],
});

test("test basic query", async () => {
    nock("http://test.invalid")
        .post("/graphql")
        .reply(200, JSON.stringify({ data: { ding: 1234 } }), {
            "content-type": "application/json",
        });

    const res = await request("http://test.invalid/graphql", {
        query: getPostsQuery,
        variables: {
            first: 10,
        },
    });

    expect(res.data).toEqual({ ding: 1234 });
});

test("can pass custom headers", async () => {
    nock("http://test.invalid", {
        reqheaders: {
            "x-test": "test",
        },
    })
        .post("/graphql")
        .reply(200, JSON.stringify({ data: { ding: 1234 } }), {
            "content-type": "application/json",
        });

    const res = await request("http://test.invalid/graphql", {
        query: getPostsQuery,
        variables: {
            first: 10,
        },
        fetchOptions: {
            headers: {
                "x-test": "test",
            },
        },
    });

    expect(res.data).toEqual({ ding: 1234 });
});

test("can use custom fetch", async () => {
    const spy = jest.fn();

    const customFetch: typeof fetch = (...args) => {
        spy();
        return fetch(...args);
    };

    nock("http://test.invalid")
        .post("/graphql")
        .reply(200, JSON.stringify({ data: { ding: 1234 } }), {
            "content-type": "application/json",
        });

    const res = await request("http://test.invalid/graphql", {
        query: getPostsQuery,
        variables: {
            first: 10,
        },
        fetch: customFetch,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(res.data).toEqual({ ding: 1234 });
});
