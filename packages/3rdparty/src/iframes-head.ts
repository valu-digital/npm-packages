import { Iframes, IframesOptions } from "./iframes";

declare global {
    interface Window {
        ValuIframesOptions?: IframesOptions;
        ValuIframes?: Iframes;
    }
}

if (typeof window !== "undefined") {
    const ValuIframes = new Iframes(window.ValuIframesOptions);
    ValuIframes.blockAll();
    window.ValuIframes = ValuIframes;
}
