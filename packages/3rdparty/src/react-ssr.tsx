import fs from "fs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import type { IFramesOptions } from "./iframes";

const inlineScript = fs
    .readFileSync(__dirname + "/iframes-head.min.js")
    .toString();

export interface ScriptAPI {
    unblock(): void;
    src: string;
}

interface BlockIframesProps {
    placeholder?: any;
    script?: (api: ScriptAPI) => any;
}

function browserExec(fn: (...args: any[]) => any): string {
    return `
        (${fn.toString()}).call(null, scriptApi);
    `;
}

export function BlockIFrames(props: BlockIframesProps) {
    let code = "";

    let placeholder = "";

    if (typeof props.placeholder === "string") {
        placeholder += props.placeholder;
    } else if (props.placeholder) {
        placeholder += ReactDOMServer.renderToStaticMarkup(props.placeholder);
    }

    let options: IFramesOptions = {
        placeholderHtml: placeholder,
    };

    if (props.script) {
        options.placeholderScript = browserExec(props.script);
    }

    code += inlineScript;

    return (
        <>
            <script
                type="application/json"
                id="valu-iframes-options"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(options),
                }}
            ></script>
            <script
                dangerouslySetInnerHTML={{
                    __html: code,
                }}
            ></script>
        </>
    );
}

export function LazyScriptGlobal() {
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `if(!window.LSU){window.LSU=[]}`,
            }}
        ></script>
    );
}
