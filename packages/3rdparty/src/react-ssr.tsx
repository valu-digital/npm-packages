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
    /** Called with the original iframe source */
    onOriginalSrc(cb: (src: string) => any): void;
}

interface BlockIframesProps {
    placeholder?: any;
    script?: (api: ScriptAPI) => any;
}

function asBase64DataURL(options: {
    html: string | any;
    script: string | ((api: ScriptAPI) => any) | undefined;
}) {
    let script = "";
    let html = "";

    if (typeof options.html !== "string") {
        html = ReactDOMServer.renderToStaticMarkup(options.html);
    } else {
        html = options.html;
    }

    if (options.script) {
        let code = "";
        if (typeof options.script === "function") {
            code = browserExec(options.script);
        } else {
            code = options.script;
        }

        script = `<script>
        ${createScriptApi()}
        ${code}
        </script>`;
    }

    const base64 = Buffer.from(
        `<html><head><meta charset="UTF-8"></head><body>${html}${script}</body></html>`,
    ).toString("base64");

    return `data:text/html;base64,${base64}`;
}

function createScriptApi() {
    return `
        window.addEventListener("message", function (event) {
            if (event.data.valuOriginalSrc) {
                scriptApi.src = event.data.valuOriginalSrc;
                if (scriptApi.cb) {
                    scriptApi.cb(scriptApi.src)
                }
            }
        });

        scriptApi = {
            unblock: function unblock() {
                window.location = scriptApi.src;
            },
            onOriginalSrc: function(cb) {
                scriptApi.cb = cb;
            }
        };
    `;
}

function browserExec(fn: (...args: any[]) => any) {
    return `
        (${fn.toString()}).call(null, scriptApi);
    `.trim();
}

export function BlockIFrames(props: BlockIframesProps) {
    let code = "";

    const placeholder = asBase64DataURL({
        html: props.placeholder,
        script: props.script,
    });

    let options: IFramesOptions = {
        placeholderSrc: placeholder,
    };

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
