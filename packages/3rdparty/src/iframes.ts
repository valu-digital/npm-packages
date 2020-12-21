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

function forEachIframe(fn: (item: HTMLIFrameElement) => void) {
    forEach(document.getElementsByTagName("iframe") as any, fn);
}

interface IframeBlockOptions {
    placeholderSrc?: string;
}

export function unblock(node: HTMLIFrameElement) {
    const src = node.getAttribute("data-blocked");
    if (src) {
        node.setAttribute("src", src);
    }
    node.removeAttribute("data-blocked");
}

export function isBlocked(node: HTMLIFrameElement) {
    return node.hasAttribute("data-blocked");
}

export class Iframes {
    options: IframeBlockOptions;

    monitoring = false;
    observer: MutationObserver | undefined;

    constructor(options: IframeBlockOptions) {
        this.options = options;
    }

    unblock = unblock;
    isBlocked = isBlocked;
    forEachIframe = forEachIframe;

    unblockAll() {
        forEachIframe(unblock);
    }

    blockAll() {
        forEachIframe((node) => this.block(node));
    }

    startMonitoring() {
        this.monitoring = true;

        if (this.observer) {
            return;
        }

        this.observer = new MutationObserver((mutations) => {
            if (!this.monitoring) {
                return;
            }

            forEach(mutations, (mut) => {
                forEach(mut.addedNodes, (node) => {
                    if (node instanceof HTMLIFrameElement) {
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
        if (typeof node.contentWindow?.stop === "function") {
            node.contentWindow.stop();
        } else {
            // IE
            node.contentWindow?.document.execCommand("Stop");
        }

        node.setAttribute("data-blocked", node.src);
        const src = this.options.placeholderSrc ?? "about:blank";
        node.src = src;
        node.setAttribute("src", src);
    }
}
