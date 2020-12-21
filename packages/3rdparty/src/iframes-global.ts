import type { Iframes } from "./iframes";

declare global {
    interface Window {
        ValuIframes?: Iframes;
    }
}

export function getIframesGlobal() {
    if (typeof window === "undefined") {
        throw new Error("Cannot be called in during SSR");
    }

    if (!window.ValuIframes) {
        throw new Error(
            "ValuIframes script is not properly configured to the <head>.",
        );
    }

    return window.ValuIframes;
}
