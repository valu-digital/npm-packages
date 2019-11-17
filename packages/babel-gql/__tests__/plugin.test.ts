import { transform } from "@babel/core";
import dedent from "dedent";

function lines(...args: string[]) {
    return args.join("\n");
}

function runPlugin(code: string, options?: unknown) {
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

test("adds source maps", () => {
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
    // expect(res.code).toEqual(lines(""));
});
