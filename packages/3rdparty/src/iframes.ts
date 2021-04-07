let debug = (..._args: any[]) => {};

if (typeof window !== "undefined" && window.localStorage.valuIFramesDebug) {
    debug = (...args: any[]) => {
        console.log("[ValuIFrames]", ...args);
    };
}

/**
 * For IE support
 */
function forEach<
    T extends any[] | NodeList | HTMLCollectionOf<HTMLIFrameElement>
>(list: T, fn: (item: T[0]) => void) {
    for (var i = 0; i < list.length; i++) {
        fn(list[i]);
    }
}

function forEachIFrame(fn: (item: HTMLIFrameElement) => void) {
    forEach(document.getElementsByTagName("iframe") as any, fn);
}

export interface IFramesOptions {
    placeholderSrc?: string;
}

export function unblock(node: HTMLIFrameElement) {
    const src = node.getAttribute("data-blocked");
    if (src) {
        debug("Unblocking iframe " + src, node);
        node.setAttribute("src", src);
    } else {
        debug("No data-blocked present, nothing to unblock.", node);
    }
    node.removeAttribute("data-blocked");
}

export function isBlocked(node: HTMLIFrameElement) {
    return node.hasAttribute("data-blocked");
}

export class IFrames {
    options: IFramesOptions;

    monitoring = false;
    observer: MutationObserver | undefined;

    constructor(options?: IFramesOptions) {
        this.options = options || {};
    }

    createPlaceholder(src: string) {
        if (this.options.placeholderSrc) {
            return this.options.placeholderSrc;
        }

        // Encode using base64 as raw html causes some issues with Facebook og-meta tags
        // return "data:text/html,<h1>Blocked</h1>";
        return "data:text/plain;base64,PGgxPkJsb2NrZWQ8L2gxPgo=";
    }

    unblock = unblock;
    isBlocked = isBlocked;
    forEachIframe = forEachIFrame;

    unblockAll() {
        this.stopMonitoring();
        forEachIFrame(unblock);
    }

    disableKey = "valuIFramesDisableBlockAll";

    isBlockAllDisabled() {
        return Boolean(window.localStorage[this.disableKey]);
    }

    /**
     * Persistently disable .blockAll()
     */
    disableBlockAll() {
        window.localStorage[this.disableKey] = "1";
    }

    enableBlockAll() {
        delete window.localStorage[this.disableKey];
    }

    blockAll() {
        if (this.isBlockAllDisabled()) {
            debug(
                "Ingoring blockAll() because localStorage.valuIFramesDisableBlockAll is set",
            );
            return;
        }

        this.startMonitoring();
        forEachIFrame((node) => this.block(node));
    }

    startMonitoring() {
        if (this.isBlockAllDisabled()) {
            debug(
                "Ingoring startMonitoring() because localStorage.valuIFramesDisableBlockAll is set",
            );
            return;
        }

        if (this.observer) {
            return;
        }

        this.monitoring = true;

        this.observer = new MutationObserver((mutations) => {
            if (!this.monitoring) {
                return;
            }

            forEach(mutations, (mut) => {
                forEach(mut.addedNodes, (node) => {
                    if (node instanceof HTMLIFrameElement) {
                        debug(
                            "Found new iframe from mutation observer",
                            node.src || node,
                        );
                        this.block(node);
                    }
                });
            });
        });

        this.observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    }

    stopMonitoring() {
        this.monitoring = false;
    }

    /**
     * Block the given iframe from loading
     */
    block(node: HTMLIFrameElement) {
        // get out if already blocked
        const blocked = node.getAttribute("data-blocked");
        if (blocked) {
            debug("Already blocked", blocked, node);
            return;
        }

        const origSrc = node.src;

        if (!origSrc) {
            debug("No src attribute. Nothing to block", node);
            return;
        }

        debug("Blocking " + origSrc, node);

        try {
            if (typeof node.contentWindow?.stop === "function") {
                node.contentWindow.stop();
            } else {
                // IE
                node.contentWindow?.document.execCommand("Stop");
            }
        } catch (error) {
            console.error(
                "[ValuIFrames] Failed to stop iframe for " + origSrc,
                error,
                node,
            );
        }

        node.addEventListener("load", () => {
            if (isBlocked(node) && node.contentWindow) {
                node.contentWindow.postMessage(
                    { valuOriginalSrc: origSrc },
                    "*",
                );
            }
        });

        node.setAttribute("data-blocked", origSrc);
        const placeholderSrc = this.createPlaceholder(origSrc);
        node.src = placeholderSrc;
        node.setAttribute("src", placeholderSrc);

        // Workaround for some Safari versions that do not detect the src update
        // inside the mutation observer
        if (typeof setImmediate === "function") {
            setImmediate(() => {
                // Trigger refresh by updating the src
                node.src += "";
            });
        }
    }
}
