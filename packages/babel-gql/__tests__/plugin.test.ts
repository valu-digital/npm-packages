import { transform } from "@babel/core";
import dedent from "dedent";
import { BabelGQLOptions } from "../src/plugin";

function lines(...args: string[]) {
    return args.join("\n");
}

function runPlugin(code: string, options?: BabelGQLOptions) {
    options = options ?? {};

    options = { ...options, active: true, target: "" };

    const res = transform(code, {
        babelrc: false,
        filename: "test.ts",
        plugins: [[__dirname + "/../src/plugin.ts", options]],
    });

    if (!res) {
        throw new Error("plugin failed");
    }

    return res;
}

test("simple transformation", () => {
    const code = dedent`
    import { gql } from "babel-gql";
    const query = gql\`
        query Foo {
            bar
        }
    \`
    `;

    const res = runPlugin(code);
    runPlugin(code);

    expect(res.code).toEqual(
        dedent`
        import { gql } from "babel-gql";
        const query = gql({
          fragments: [],
          queries: [{
            queryId: "5430c050ffd840248a6724bb3a674ffb347dce047429ba5bf61a9edee3d8d699",
            queryName: "Foo",
            usedFragments: []
          }]
        });
    `.trim(),
    );
});

test("can follow import alias", () => {
    const code = dedent`
    import { gql as foo } from "babel-gql";
    const query = foo\`
        query Foo {
            bar
        }
    \`
    `;

    const res = runPlugin(code);
    runPlugin(code);

    expect(res.code).toEqual(
        dedent`
        import { gql as foo } from "babel-gql";
        const query = foo({
          fragments: [],
          queries: [{
            queryId: "5430c050ffd840248a6724bb3a674ffb347dce047429ba5bf61a9edee3d8d699",
            queryName: "Foo",
            usedFragments: []
          }]
        });
    `.trim(),
    );
});

test("can handle fragments", () => {
    const code = dedent`
    import { gql } from "babel-gql";
    const query = gql\`
      fragment NameParts on Person {
        firstName
        lastName
      }

      query GetPerson {
        people(id: "7") {
          ...NameParts
          avatar(size: LARGE)
        }
      }
    \`
    `;

    const res = runPlugin(code);
    runPlugin(code);

    expect(res.code).toEqual(
        dedent`
        import { gql } from "babel-gql";
        const query = gql({
          fragments: [{
            fragmentId: "599e02d0c3048527281d6b78058b8886cb93fca9d4f795f8383190abfcaecf5e",
            fragmentName: "NameParts",
            usedFragments: []
          }],
          queries: [{
            queryId: "ea45bb731caccf48a370efdd98de551f9cb8c4926ddd6e440ad95a5090387716",
            queryName: "GetPerson",
            usedFragments: ["NameParts"]
          }]
        });
        `.trim(),
    );
});

test("fragments can use fragments", () => {
    const code = dedent`
    import { gql } from "babel-gql";
    const query = gql\`
      fragment NameParts on Person {
        firstName
        lastName
      }

      fragment MoreParts on Car {
        driver {
          ...NameParts
          avatar(size: LARGE)
        }
      }
    \`
    `;

    const res = runPlugin(code);
    runPlugin(code);

    expect(res.code).toEqual(
        dedent`
        import { gql } from "babel-gql";
        const query = gql({
          fragments: [{
            fragmentId: "599e02d0c3048527281d6b78058b8886cb93fca9d4f795f8383190abfcaecf5e",
            fragmentName: "NameParts",
            usedFragments: []
          }, {
            fragmentId: "e600ee95689cda215e9fe3b8f65b4b4958284c2cc0d239379eda71cd427b2cc3",
            fragmentName: "MoreParts",
            usedFragments: ["NameParts"]
          }],
          queries: []
        });
        `.trim(),
    );
});

test("can handle embedded fragments", () => {
    const code = lines(
        'import { gql } from "babel-gql";',
        "const query = gql`",
        "   ${NameParts}",
        "   query GetPerson {",
        '       people(id: "7") {',
        "           ...NameParts",
        "           avatar(size: LARGE)",
        "       }",
        "}`",
    );

    const res = runPlugin(code);
    runPlugin(code);

    expect(res.code).toEqual(
        dedent`
        import { gql } from "babel-gql";
        const query = gql({
          fragments: [],
          queries: [{
            queryId: "ea45bb731caccf48a370efdd98de551f9cb8c4926ddd6e440ad95a5090387716",
            queryName: "GetPerson",
            usedFragments: ["NameParts"]
          }]
        });
        `.trim(),
    );
});

test("invalid graphql shows proper error message", () => {
    const code = dedent`
    import { gql } from "babel-gql";
    const query = gql\`
        query Foo
            bar
        }
    \`
    `;

    expect(() => {
        runPlugin(code);
    }).toThrow("GraphQL:");
});

test("can handle 3rd party graphql tags when our tag is imported", () => {
    const code = dedent`
    import { gql } from "babel-gql";
    import { gql as apollo } from 'apollo-boost';
    const query = apollo\`
        query Foo {
            bar
        }
    \`
    `;

    const res = runPlugin(code);
    runPlugin(code);
    console.log(res.code);

    // expect(res.code).toEqual(
    //     dedent`
    //     import { gql } from "babel-gql";
    //     const query = gql({
    //       fragments: [],
    //       queries: [{
    //         queryId: "5430c050ffd840248a6724bb3a674ffb347dce047429ba5bf61a9edee3d8d699",
    //         queryName: "Foo",
    //         usedFragments: []
    //       }]
    //     });
    // `.trim(),
    // );
});
