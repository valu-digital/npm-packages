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
) {
    if (typeof window === "undefined") {
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
            return window.Cookiebot;
        },
        mutate: (el) => {
            el.dataset.blockingmode = "manual";
            el.dataset.cbid = cbid;
            el.id = "Cookiebot";
        },
    });

    window.addEventListener(
        "CookiebotOnAccept",
        () => {
            if (window.Cookiebot?.hasResponse) {
                trackingConsent.consent();
            }
        },
        false,
    );

    window.addEventListener(
        "CookiebotOnDecline",
        () => {
            if (window.Cookiebot?.hasResponse) {
                trackingConsent.decline();
            }
        },
        false,
    );

    trackingConsent.onEvent((event) => {
        switch (event) {
            case "init": {
                /**
                 * Disable all blocking for the cookiebot crawler so it can see
                 * the trackers
                 *
                 * https://support.cookiebot.com/hc/en-us/community/posts/360010100774-UserAgent-Need-to-know-its-CookieBot-to-avoid-Blocking-unknown-Scanner
                 *
                 *    'Yes. Since the last update, you could now identify
                 *    Cookiebot through the user agent string and it will contain
                 *    "Cookiebot".'
                 *
                 * User agent seems to be like this:
                 *
                 *  Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko; compatible; Cookiebot/1.0; +http://cookiebot.com/) Chrome/86.0.4240.183 Safari/537.36
                 *
                 */
                if (/cookiebot/i.test(window.navigator.userAgent)) {
                    trackingConsent.consent();
                    CookiebotScript.now();
                }
                return;
            }

            case "forget": {
                CookiebotScript.now();

                return CookiebotScript.promise().then((cb) => {
                    cb.renew();
                });
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
