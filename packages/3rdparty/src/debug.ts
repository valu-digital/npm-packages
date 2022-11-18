export const debug = (() => {
    if (
        typeof window !== "undefined" &&
        window.localStorage.valuTrackingConsentDebug
    ) {
        const anyConsole = console as any;
        let method = window.localStorage.valuTrackingConsentDebug;
        if (typeof anyConsole[method] === "undefined") {
            method = "log";
        }

        return (...args: any[]) => {
            anyConsole[method]("[ValuTrackingConsent]", ...args);
        };
    }

    return (..._args: any[]) => {};
})();
