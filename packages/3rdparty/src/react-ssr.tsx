import fs from "fs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import type { IframesOptions } from "./iframes";

const inlineScript = fs
    .readFileSync(__dirname + "/iframes-head.min.js")
    .toString();

function defineGlobal(name: string, value: any) {
    return `window.${name} = ${JSON.stringify(value)};\n`;
}

interface BlockIframesProps extends IframesOptions {
    placeholder?: any;
}

export function BlockIframes(props: BlockIframesProps) {
    let code = "";

    let options: IframesOptions = {
        placeholderSrc: props.placeholderSrc,
    };

    if (typeof props.placeholder === "string") {
        options.placeholderSrc = "data:text/html," + props.placeholder;
    } else if (props.placeholder) {
        options.placeholderSrc =
            "data:text/html," +
            ReactDOMServer.renderToStaticMarkup(props.placeholder);
    }

    code += defineGlobal("ValuIframesOptions", options);
    code += inlineScript;

    return (
        <script
            dangerouslySetInnerHTML={{
                __html: code,
            }}
        ></script>
    );
}
