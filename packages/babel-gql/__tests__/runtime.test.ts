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
