import { debug } from "./debug";
import { LazyScript } from "./lazy-script";
import type { TrackingConsent } from "./tracking-consent";

/**
 * Type for the Cookiebot global variable
 *
 * https://www.cookiebot.com/en/developer/
 */
interface Cookiebot {
    /**
     * True if the user has accepted cookies. The property is read only.
     */
    consented: boolean;

    /**
     * True if the user has declined the use of cookies. The property is read
     * only.
     */
    declined: boolean;

    /**
     * True if the user has responded to the dialog with either 'accept' or
     * 'decline'. The property is read only.
     */
    hasResponse: boolean;

    /**
     * Forces the cookie consent dialog to show.
     */
    show(): void;

    /**
     * Withdraw my consent for this website.
     */
    withdraw(): void;

    /**
     * Shows the cookie consent dialog to the website user to renew or change
     * the user's consent state.
     */
    renew(): void;
}

declare global {
    interface Window {
        // available only when the lazy script has loaded it
        Cookiebot?: Cookiebot;
    }
}

export function connectCookieBot(
    trackingConsent: TrackingConsent,
    /**
     * The cookiebot id
     */
    cbid: string,
    /**
     * Language
     */
    lang?: string,
) {
    if (typeof window === "undefined") {
        return;
    }

    // Disable cookiebot integration temporally
    // vlu3rdcb = "valu 3rd party cookiebot"
    if (/_vlu3rdcb=0/.test(location.search)) {
        console.warn(
            "[@valu/3rdparty] Cookiebot integration disabled due to qs flag.",
        );
        return;
    }

    const CookiebotScript = new LazyScript({
        name: "cookiebot",
        src: "https://consent.cookiebot.com/uc.js",
        initialize: () => {
            if (!window.Cookiebot) {
                throw new Error(
                    "@valu/3rdparty: Cookiebot did not load properly",
                );
            }

            debug("Cookiebot loaded");
            return window.Cookiebot;
        },
        mutate: (el) => {
            el.dataset.blockingmode = "manual";
            if (lang) {
                el.dataset.culture = lang;
            }
            el.dataset.cbid = cbid;
            el.id = "Cookiebot";
        },
    });

    window.addEventListener(
        "CookiebotOnAccept",
        () => {
            debug("Cookiebot sent CookiebotOnAccept. Consenting...");
            trackingConsent.consent();
        },
        false,
    );

    window.addEventListener(
        "CookiebotOnDecline",
        () => {
            debug("Cookiebot sent CookiebotOnDecline. Declining...");
            trackingConsent.decline();
        },
        false,
    );

    trackingConsent.onEvent((event) => {
        switch (event) {
            case "init": {
                return;
            }

            case "forget": {
                document.cookie = "CookieConsent=; Max-Age=-99999999;";
                return;
            }

            case "request-prompt": {
                CookiebotScript.now((cb) => {
                    // If cookiebot has no response we must not call cb.show()
                    // because it will open the dialog automatically on load. If
                    // we call it as well it will flash.
                    if (cb.hasResponse) {
                        cb.show();
                    }
                });
                return;
            }

            // No need to handle these beacuse this is just a one away binding.
            // Eg. we only sync the state from the cookiebot to TrackingConsent
            case "consented":
            case "declined": {
                return;
            }
        }

        // TypeScript trick to ensure all events are handled
        const _: never = event;
    });
}
