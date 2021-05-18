import React from "react";

export type InlineScriptProps<Fn extends (...args: any[]) => any> =
    Fn extends () => any
        ? {
              exec: Fn;
              args?: [];
          }
        : {
              exec: Fn;
              args: Parameters<Fn>;
          };

export function InlineScript<Fn extends (...args: any[]) => any>(
    props: InlineScriptProps<Fn>,
) {
    const strArgs = JSON.stringify(props.args || []);

    let script = `(${props.exec.toString()}).apply(null, ${strArgs});`;

    return <script dangerouslySetInnerHTML={{ __html: script }}></script>;
}

InlineScript.Raw = function RawInlineScript(props: { code: string }) {
    return <script dangerouslySetInnerHTML={{ __html: props.code }}></script>;
};

/**
 * No-op template tag for css. This only for editor syntax highlighting.
 */
export function css(strings: TemplateStringsArray, ...expr: string[]) {
    let str = "";
    strings.forEach((string, i) => {
        str += string + (expr[i] || "");
    });

    return { cssForInlining: str };
}

export function InlineStyle(props: {
    css:
        | { cssForInlining: string }
        | ((cssFn: typeof css) => { cssForInlining: string });
}) {
    let cssStr = "";

    if (typeof props.css === "function") {
        cssStr = props.css(css).cssForInlining;
    } else {
        cssStr = props.css.cssForInlining;
    }

    return <style dangerouslySetInnerHTML={{ __html: cssStr }}></style>;
}
