import fs from "fs";
import React from "react";
import type { IframesOptions } from "./iframes";

const inlineScript = fs
    .readFileSync(__dirname + "/iframes-head.min.js")
    .toString();

function defineGlobal(name: string, value: any) {
    return `window.${name} = ${JSON.stringify(value)};\n`;
}

export function BlockIframes(props: IframesOptions) {
    let code = "";

    code += defineGlobal("ValuIframesOptions", props);
    code += inlineScript;

    return (
        <script
            dangerouslySetInnerHTML={{
                __html: code,
            }}
        ></script>
    );
}
