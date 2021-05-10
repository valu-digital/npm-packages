import { QueryManager } from "../src/query-manager";
import { gql } from "./helpers";

test("single query", () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
    `);

    const queries = qm.popDirtyQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0].queryName).toBe("FooQuery");
});

test("single query can update", () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
    `);

    const queries = qm.popDirtyQueries();
    expect(queries).toHaveLength(1);

    expect(queries[0]).toMatchObject({
        queryName: "FooQuery",
        queryId: expect.stringMatching(/.+/),
        query: gql`
            query FooQuery {
                field
            }
        `,
        usedFragments: [],
    });

    qm.parseGraphQL(gql`
        query FooQuery {
            fieldUpdated
        }
    `);

    const queries2 = qm.popDirtyQueries();
    expect(queries2).toHaveLength(1);

    expect(queries2[0]).toMatchObject({
        queryName: "FooQuery",
        queryId: expect.stringMatching(/.+/),
        query: gql`
            query FooQuery {
                fieldUpdated
            }
        `,
        usedFragments: [],
    });
});

test("no export if no change in query", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(1);

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(0);
    expect(qm.getQueries()).toHaveLength(1);
});

test("multiple queries in single string", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
        query BarQuery {
            field
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(2);
    expect(qm.getQueries()).toHaveLength(2);
});

test("multiple queries in multiple strings", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
    `);

    qm.parseGraphQL(gql`
        query BarQuery {
            field
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(2);
    expect(qm.getQueries()).toHaveLength(2);
});

test("single mutation", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        mutation FooMutation($arg: String!) {
            createFoo(arg: $arg) {
                foo
            }
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(1);
    expect(qm.getQueries()).toHaveLength(1);
});

test("single query with fragment", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        fragment FooFragment on Foo {
            field2
        }

        query FooQuery {
            field2
            ...FooFragment
        }
    `);

    const queries = qm.popDirtyQueries();
    expect(qm.getQueries()).toHaveLength(1);

    expect(queries[0]).toMatchObject({
        queryName: "FooQuery",
        query: gql`
            query FooQuery {
                field2
                ...FooFragment
            }
        `,
        usedFragments: [
            {
                fragmentName: "FooFragment",
                fragmentId: expect.stringMatching(/.+/),
                fragment: gql`
                    fragment FooFragment on Foo {
                        field2
                    }
                `,
            },
        ],
    });
});

test("fragment update triggers dirty query export", () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        fragment FooFragment on Foo {
            field2
        }

        query FooQuery {
            field2
            ...FooFragment
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(1);

    qm.parseGraphQL(gql`
        fragment FooFragment on Foo {
            field2
            newField
        }
    `);

    const queries = qm.popDirtyQueries();
    expect(queries).toHaveLength(1);

    expect(queries[0]).toMatchObject({
        queryName: "FooQuery",
        query: gql`
            query FooQuery {
                field2
                ...FooFragment
            }
        `,
        usedFragments: [
            {
                fragmentName: "FooFragment",
                fragmentId: expect.stringMatching(/.+/),
                fragment: gql`
                    fragment FooFragment on Foo {
                        field2
                        newField
                    }
                `,
            },
        ],
    });
});

test("unrelated fragment does not trigger export", () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        query FooQuery {
            field2
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(1);

    qm.parseGraphQL(gql`
        fragment SomeFragment on Foo {
            field2
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(0);
});

test("adding fragment dep causes export", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        fragment SomeFragment on Foo {
            field2
        }

        query FooQuery {
            field2
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(1);

    qm.parseGraphQL(gql`
        query FooQuery {
            ...SomeFragment
            field2
        }
    `);

    const queries = qm.popDirtyQueries();

    expect(queries).toHaveLength(1);

    expect(queries[0]).toMatchObject({
        queryName: "FooQuery",
        query: gql`
            query FooQuery {
                ...SomeFragment
                field2
            }
        `,
        usedFragments: [
            {
                fragmentName: "SomeFragment",
                fragment: gql`
                    fragment SomeFragment on Foo {
                        field2
                    }
                `,
            },
        ],
    });
});

test("does not export before all fragments are defined", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        query FooQuery {
            field2
            ...FooFragment
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(0);
    expect(qm.getQueries()).toHaveLength(0);

    qm.parseGraphQL(gql`
        fragment FooFragment on Foo {
            field2
            newField
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(1);
    expect(qm.getQueries()).toHaveLength(1);
});

test("can handle nested fragments", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        fragment Fragment1 on Foo {
            field1
        }

        fragment Fragment2 on Foo {
            field2
            ...Fragment1
        }

        query FooQuery {
            field3
            ...Fragment2
        }
    `);

    const queries = qm.popDirtyQueries();
    expect(queries).toHaveLength(1);

    expect(queries[0].usedFragments).toHaveLength(2);

    expect(queries[0]).toMatchObject({
        queryName: "FooQuery",
        query: gql`
            query FooQuery {
                field3
                ...Fragment2
            }
        `,
        usedFragments: [
            {
                fragment: gql`
                    fragment Fragment1 on Foo {
                        field1
                    }
                `,
            },
            {
                fragment: gql`
                    fragment Fragment2 on Foo {
                        field2
                        ...Fragment1
                    }
                `,
            },
        ],
    });
});

test("does not export when all nested fragments are not defined", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        fragment Fragment2 on Foo {
            field2
            ...Fragment1
        }

        query FooQuery {
            field3
            ...Fragment2
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(0);
    expect(qm.getQueries()).toHaveLength(0);

    qm.parseGraphQL(gql`
        fragment Fragment1 on Foo {
            field1
        }
    `);

    const queries = qm.popDirtyQueries();

    expect(queries).toHaveLength(1);
    expect(qm.getQueries()).toHaveLength(1);

    expect(queries[0].usedFragments).toHaveLength(2);

    expect(queries[0]).toMatchObject({
        queryName: "FooQuery",
        query: gql`
            query FooQuery {
                field3
                ...Fragment2
            }
        `,
        usedFragments: [
            {
                fragment: gql`
                    fragment Fragment1 on Foo {
                        field1
                    }
                `,
            },
            {
                fragment: gql`
                    fragment Fragment2 on Foo {
                        field2
                        ...Fragment1
                    }
                `,
            },
        ],
    });
});

test("change to nested fragment triggers update", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        fragment Fragment1 on Foo {
            field1
        }

        fragment Fragment2 on Foo {
            field2
            ...Fragment1
        }

        query FooQuery {
            field3
            ...Fragment2
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(1);

    qm.parseGraphQL(gql`
        fragment Fragment1 on Foo {
            fieldChange
        }
    `);

    const queries = qm.popDirtyQueries();
    expect(queries).toHaveLength(1);

    expect(queries[0].usedFragments).toHaveLength(2);

    expect(queries[0]).toMatchObject({
        queryName: "FooQuery",
        query: gql`
            query FooQuery {
                field3
                ...Fragment2
            }
        `,
        usedFragments: [
            {
                fragment: gql`
                    fragment Fragment1 on Foo {
                        fieldChange
                    }
                `,
            },
            {
                fragment: gql`
                    fragment Fragment2 on Foo {
                        field2
                        ...Fragment1
                    }
                `,
            },
        ],
    });
});

test("no export if fragment does not actually change", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        fragment Fragment1 on Foo {
            field1
        }

        fragment Fragment2 on Foo {
            field2
            ...Fragment1
        }

        query FooQuery {
            field3
            ...Fragment2
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(1);

    qm.parseGraphQL(gql`
        fragment Fragment1 on Foo {
            field1
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(0);
});

test("can define query before fragment it uses", async () => {
    const qm = new QueryManager();

    qm.parseGraphQL(gql`
        query FooQuery {
            field3
            ...Fragment
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(0);

    qm.parseGraphQL(gql`
        fragment Fragment on Foo {
            field1
        }
    `);

    expect(qm.popDirtyQueries()).toHaveLength(1);
});
