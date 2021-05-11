import type { IFrames } from "./iframes";

declare global {
    interface Window {
        ValuIFrames?: IFrames;
    }
}

export function getIFramesGlobal() {
    if (typeof window === "undefined") {
        throw new Error("Cannot be called in during SSR");
    }

    if (!window.ValuIFrames) {
        throw new Error(
            "ValuIframes script is not properly configured to the <head>.",
        );
    }

    return window.ValuIFrames;
}
