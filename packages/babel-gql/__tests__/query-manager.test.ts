import { QueryManager } from "../src/query-manager";
import { print, parse } from "graphql";
import dedent from "dedent";
// Nooop gql fn for prettier
function gql(...things: TemplateStringsArray[]) {
    return print(parse(things.join(""))).trim();
}

test("single query", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);
});

test("single query can update", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);

    qm.parseGraphQL(gql`
        query FooQuery {
            fieldUpdated
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(2);

    const arg = spy.mock.calls[1][0];

    expect(arg).toEqual({
        query: gql`
            query FooQuery {
                fieldUpdated
            }
        `,
        fragments: [],
    });
});

test("no export if no change in query", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);
});

test("multiple queries in single string", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        query FooQuery {
            field
        }
        query BarQuery {
            field
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(2);
});

test("multiple queries in multiple strings", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

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

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(2);
});

test("single mutation", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        mutation FooMutation($arg: String!) {
            createFoo(arg: $arg) {
                foo
            }
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);
});

test("single query with fragment", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        fragment FooFragment on Foo {
            field2
        }

        query FooQuery {
            field2
            ...FooFragment
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);
    const arg = spy.mock.calls[0][0];
    expect(arg).toEqual({
        query: gql`
            query FooQuery {
                field2
                ...FooFragment
            }
        `,
        fragments: [
            gql`
                fragment FooFragment on Foo {
                    field2
                }
            `,
        ],
    });
});

test("fragment update triggers query export", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        fragment FooFragment on Foo {
            field2
        }

        query FooQuery {
            field2
            ...FooFragment
        }
    `);

    await qm.exportDirtyQueries();

    qm.parseGraphQL(gql`
        fragment FooFragment on Foo {
            field2
            newField
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(2);
    const arg = spy.mock.calls[1][0];

    expect(arg).toEqual({
        query: gql`
            query FooQuery {
                field2
                ...FooFragment
            }
        `,
        fragments: [
            gql`
                fragment FooFragment on Foo {
                    field2
                    newField
                }
            `,
        ],
    });
});

test("unrelated fragment does not trigger export", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        query FooQuery {
            field2
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);

    qm.parseGraphQL(gql`
        fragment SomeFragment on Foo {
            field2
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);
});

test("adding fragment dep causes export", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        fragment SomeFragment on Foo {
            field2
        }

        query FooQuery {
            field2
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);

    qm.parseGraphQL(gql`
        query FooQuery {
            ...SomeFragment
            field2
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(2);

    const arg = spy.mock.calls[1][0];

    expect(arg).toEqual({
        query: gql`
            query FooQuery {
                ...SomeFragment
                field2
            }
        `,
        fragments: [
            gql`
                fragment SomeFragment on Foo {
                    field2
                }
            `,
        ],
    });
});

test("does not export before all fragments are defined", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        query FooQuery {
            field2
            ...FooFragment
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(0);

    qm.parseGraphQL(gql`
        fragment FooFragment on Foo {
            field2
            newField
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);
});

test("can handle nested fragments", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

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

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);

    const arg = spy.mock.calls[0][0];

    expect(arg.fragments).toHaveLength(2);

    expect(arg).toEqual({
        query: gql`
            query FooQuery {
                field3
                ...Fragment2
            }
        `,
        fragments: [
            gql`
                fragment Fragment1 on Foo {
                    field1
                }
            `,
            gql`
                fragment Fragment2 on Foo {
                    field2
                    ...Fragment1
                }
            `,
        ],
    });
});

test("does not export when all nested fragments are not defined", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

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

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(0);

    qm.parseGraphQL(gql`
        fragment Fragment1 on Foo {
            field1
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);

    const arg = spy.mock.calls[0][0];

    expect(arg.fragments).toHaveLength(2);

    expect(arg).toEqual({
        query: gql`
            query FooQuery {
                field3
                ...Fragment2
            }
        `,
        fragments: [
            gql`
                fragment Fragment1 on Foo {
                    field1
                }
            `,
            gql`
                fragment Fragment2 on Foo {
                    field2
                    ...Fragment1
                }
            `,
        ],
    });
});

test("change to nested fragment triggers update", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

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

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);

    qm.parseGraphQL(gql`
        fragment Fragment1 on Foo {
            fieldChange
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(2);

    const arg = spy.mock.calls[1][0];

    expect(arg.fragments).toHaveLength(2);

    expect(arg).toEqual({
        query: gql`
            query FooQuery {
                field3
                ...Fragment2
            }
        `,
        fragments: [
            gql`
                fragment Fragment1 on Foo {
                    fieldChange
                }
            `,
            gql`
                fragment Fragment2 on Foo {
                    field2
                    ...Fragment1
                }
            `,
        ],
    });
});

test("no export if fragment does not actually change", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

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

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);

    qm.parseGraphQL(gql`
        fragment Fragment1 on Foo {
            field1
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);
});

test("can define query before fragment it uses", async () => {
    const spy = jest.fn();

    const qm = new QueryManager({
        onExportQuery: spy,
    });

    qm.parseGraphQL(gql`
        query FooQuery {
            field3
            ...Fragment
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(0);

    qm.parseGraphQL(gql`
        fragment Fragment on Foo {
            field1
        }
    `);

    await qm.exportDirtyQueries();

    expect(spy).toHaveBeenCalledTimes(1);
});
