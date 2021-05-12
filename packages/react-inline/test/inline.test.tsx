import React from "react";
import { css, InlineScript } from "../src";

test("css can have variables", () => {
    expect(
        css`
            color: ${"red"};
        `,
    ).toMatchInlineSnapshot(`
        Object {
          "cssForInlining": "
                    color: red;
                ",
        }
    `);
});

test("script with args", () => {
    expect(
        InlineScript({
            args: ["World"],
            fn: (name: string) => `Hello ${name}`,
        }),
    ).toMatchInlineSnapshot(`
        <script
          dangerouslySetInnerHTML={
            Object {
              "__html": "(function (name) { return \\"Hello \\" + name; }).apply(null, [\\"World\\"]);",
            }
          }
        />
    `);
});

test("script with args require args prop", () => {
    () => {
        // @ts-expect-error
        <InlineScript fn={(arg: string) => {}} />;

        <InlineScript args={[""]} fn={(arg: string) => {}} />;
    };
});

test("script without args do notrequire args prop", () => {
    () => {
        <InlineScript fn={() => {}} />;
    };
});
