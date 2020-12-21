import { Iframes } from "./iframes";

declare global {
    interface Window {
        ValuIframes?: Iframes;
    }
}

if (typeof window !== "undefined") {
    const optionsEl = document.getElementById("valu-iframes-options");
    let options = {};
    if (optionsEl) {
        options = JSON.parse(optionsEl.innerHTML);
    }

    const ValuIframes = new Iframes(options);
    ValuIframes.blockAll();
    window.ValuIframes = ValuIframes;
}
