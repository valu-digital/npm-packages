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

export interface IframesOptions {
    placeholderSrc?: string;
    placeholderHtml?: string;
    placeholderScript?: string;
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

function createScriptApi(options: { src: string }) {
    return `
    scriptApi = {
        src:  ${JSON.stringify(options.src)},
        unblock: function unblock() {
            window.location = scriptApi.src;
        }
    };
    `;
}

export class Iframes {
    options: IframesOptions;

    monitoring = false;
    observer: MutationObserver | undefined;

    constructor(options?: IframesOptions) {
        this.options = options || {};
    }

    createPlaceholder(src: string) {
        if (this.options.placeholderSrc) {
            return this.options.placeholderSrc;
        }

        if (this.options.placeholderHtml) {
            let html = this.options.placeholderHtml;

            if (this.options.placeholderScript) {
                html += `
                <script>
                    ${createScriptApi({ src: src })}
                    ${this.options.placeholderScript}
                </script>`;
            }

            return "data:text/html," + encodeURI(html);
        }

        return "data:text/html,<h1>Blocked</h1>";
    }

    unblock = unblock;
    isBlocked = isBlocked;
    forEachIframe = forEachIframe;

    unblockAll() {
        this.stopMonitoring();
        forEachIframe(unblock);
    }

    blockAll() {
        this.startMonitoring();
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
        const placeholderSrc = this.createPlaceholder(node.src);
        node.src = placeholderSrc;
        node.setAttribute("src", placeholderSrc);
    }
}
