import { IFrames } from "./iframes";

declare global {
    interface Window {
        ValuIFrames?: IFrames;
    }
}

if (typeof window !== "undefined") {
    const optionsEl = document.getElementById("valu-iframes-options");
    let options = {};
    if (optionsEl) {
        options = JSON.parse(optionsEl.innerHTML);
    }

    const ValuIFrames = new IFrames(options);
    ValuIFrames.blockAll();
    window.ValuIFrames = ValuIFrames;
}
