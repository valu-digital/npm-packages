import { subscribe } from "valtio";

interface Listener {
    (...args: any[]): any;
}

interface Emitter {
    addEventListener(event: string, cb: Listener): any;
    removeEventListener(event: string, cb: Listener): any;
}

const isNextjs = typeof window !== "undefined" && "__NEXT_DATA__" in window;

function multiListener() {
    let unbinds = [] as Function[];

    return {
        onEventTarget(emitter: Emitter, event: string, cb: Listener) {
            emitter.addEventListener(event, cb);

            unbinds.push(() => {
                emitter.removeEventListener(event, cb);
            });
        },
        removeAll: () => {
            unbinds.forEach((unbind) => unbind());
            unbinds = [];
        },
        custom: (unbind: Function) => {
            unbinds.push(unbind);
        },
    };
}

type Methods<T> = {
    [K in keyof T]: T[K] extends (...args: any) => any ? K : never;
}[keyof T];

class Spy {
    private handlers: (() => any)[];

    constructor() {
        this.handlers = [];
    }

    spyMethod<T>(target: T, method: Methods<T>) {
        const orig: any = target[method];
        const anyTarget: any = target;

        anyTarget[method] = (...args: any) => {
            const res = orig.apply(anyTarget, args);
            this.handlers.forEach((handler) => handler());
            return res;
        };
    }

    onCall = (cb: () => any) => {
        this.handlers.push(cb);
        return () => {
            this.remove(cb);
        };
    };

    remove = (cb: () => any) => {
        const index = this.handlers.indexOf(cb);
        this.handlers.splice(index, 1);
    };
}

const spy = new Spy();

if (typeof history !== "undefined") {
    spy.spyMethod(history, "replaceState");
    spy.spyMethod(history, "pushState");
}

export interface ValtioLocationSyncOptions<State> {
    key?: string;
    debounceTime?: number;
    nextjsRouter?: NextjsRouterLike | null;
    historyReplaceState?: (url: URL) => Promise<any> | undefined | void;
    readURL?: (url: URL) => Partial<State> | undefined;
    writeURL?: (state: State, url: URL) => URL | undefined | void;
}

function historyReplaceState(url: URL) {
    history.replaceState(history.state, "", url.toString());
}

// Just structually type enough of the next.js router interface so we don't have
// to depend on Next.js directly
export interface NextjsRouterLike {
    replace: (
        url: string,
        as: string,
        options?: {
            shallow?: boolean;
            scroll?: false;
        },
    ) => Promise<any>;
    pathname: string;
    asPath: string;
}

function createNextjsRouterReplace(nextjsRouter: NextjsRouterLike) {
    return function nextjsRouterReplace(url: URL) {
        // Removing the existing query string part because the given "url" param
        // contains the full updated query string already
        const path = nextjsRouter.asPath.replace(/\?.+/, "");
        return nextjsRouter.replace(
            nextjsRouter.pathname,
            path + url.search + url.hash,
            {
                // Do not scroll up on update
                scroll: false,
                // Do not fetch page props on update. This does not have
                // server-side presense so it is not needed
                shallow: true,
            },
        );
    };
}

export class ValtioLocationSync<State> {
    private writeTimer?: ReturnType<typeof setTimeout>;
    private readTimer?: ReturnType<typeof setTimeout>;
    private options: Required<ValtioLocationSyncOptions<State>>;
    private state: State;
    private listeners = multiListener();
    private active = false;
    private pendingWrite?: Promise<any>;
    private retryWrite = false;

    constructor(state: State, options?: ValtioLocationSyncOptions<State>) {
        this.state = state;
        this.options = {
            key: "data",
            historyReplaceState,
            debounceTime: 1000,
            nextjsRouter: null,
            readURL: (url) => {
                const value = url.searchParams.get(this.options.key);
                if (!value) {
                    return;
                }

                return JSON.parse(value);
            },
            writeURL: (state, url) => {
                url.searchParams.set(this.options.key, JSON.stringify(state));
            },
            ...options,
        };

        const usingDefaultReplace =
            this.options.historyReplaceState === historyReplaceState;

        if (isNextjs && usingDefaultReplace) {
            if (!this.options.nextjsRouter) {
                throw new Error(
                    `[valtio-location] Next.js detected. You must pass in 'nextjsRouter'. See https://git.io/Jz0jf`,
                );
            }

            this.options.historyReplaceState = createNextjsRouterReplace(
                this.options.nextjsRouter,
            );
        }
    }

    readURL = () => {
        if (this.pendingWrite) {
            return;
        }

        const url = new URL(location.toString());

        const value = this.options.readURL(url);
        if (!value) {
            return;
        }

        Object.assign(this.state, value);
    };

    writeURL = (): Promise<any> => {
        if (!this.active) {
            return Promise.resolve();
        }

        this.cancelWriteDebounce();

        if (this.pendingWrite) {
            if (this.retryWrite) {
                return Promise.resolve();
            }

            this.retryWrite = true;
            return this.pendingWrite.then(this.writeURL);
        }

        const currentURL = new URL(location.toString());
        const newURL =
            this.options.writeURL(this.state, currentURL) || currentURL;

        // If no actual change no need to call the replace state
        if (location.toString().toString() === newURL.toString()) {
            return Promise.resolve();
        }

        this.pendingWrite =
            this.options.historyReplaceState(newURL) || Promise.resolve();

        return this.pendingWrite.then(() => {
            this.pendingWrite = undefined;
            this.retryWrite = false;
        });
    };

    cancelWriteDebounce = () => {
        if (this.writeTimer) {
            clearTimeout(this.writeTimer);
        }
    };

    cancelReadDebounce = () => {
        if (this.readTimer) {
            clearTimeout(this.readTimer);
        }
    };

    debouncedWriteURL = () => {
        this.cancelWriteDebounce();

        if (!this.active) {
            return;
        }

        this.writeTimer = setTimeout(this.writeURL, this.options.debounceTime);
    };

    debouncedReadURL = () => {
        this.cancelReadDebounce();
        this.readTimer = setTimeout(this.readURL, 100);
    };

    start = () => {
        if (this.active) {
            return this.stop;
        }

        this.active = true;
        this.readURL();

        // Browser back button
        this.listeners.onEventTarget(window, "popstate", this.debouncedReadURL);

        // Immediately save when the window is unfocused
        this.listeners.onEventTarget(window, "blur", this.writeURL);

        // Immediately save when user navigates to another page
        this.listeners.onEventTarget(window, "beforeunload", this.writeURL);

        // Handle manual history.replaceState / history.pushState calls
        this.listeners.custom(spy.onCall(this.debouncedReadURL));

        // Debounced sync on Valtio state changes
        this.listeners.custom(subscribe(this.state, this.debouncedWriteURL));

        return this.stop;
    };

    stop = () => {
        this.active = false;
        this.cancelWriteDebounce();
        this.cancelReadDebounce();
        this.listeners.removeAll();
    };
}

export function sync<State>(
    state: State,
    options?: ValtioLocationSyncOptions<State>,
) {
    return new ValtioLocationSync(state, options);
}
