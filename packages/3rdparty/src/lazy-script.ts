declare global {
    interface Window {
        LazyScriptUnblock: string[];
    }
}

export interface LazyScriptOptions<T> {
    name: string;
    src: string;
    blocked?: boolean;
    initialize?: () => Promise<T> | T;
    mutateScript?: (script: HTMLScriptElement) => any;
    onScriptAdded?: (script: HTMLScriptElement) => any;
}

export class LazyScript<T = any> {
    private resolve = (arg?: unknown) => {};

    private readonly promise: Promise<T>;

    state: "pending" | "blocked" | "waiting-unblock" | "loading" | "ready";

    name: string;

    options: LazyScriptOptions<T>;

    listeners: ((state: LazyScript["state"]) => any)[];

    static all = [] as LazyScript[];

    el?: HTMLScriptElement;

    constructor(options: LazyScriptOptions<T>) {
        LazyScript.all.push(this);
        this.name = options.name;
        this.options = options;

        if (options.blocked) {
            this.state = "blocked";
        } else {
            this.state = "pending";
        }

        this.listeners = [];
        this.promise = new Promise((resolve) => {
            this.resolve = resolve;
        })
            .then(options.initialize)
            .then((res) => {
                this.setState("ready");
                return res;
            });

        this.unblockFromGlobal();
    }

    private setState(state: LazyScript["state"]) {
        if (this.state !== state) {
            this.state = state;
            this.listeners.forEach((fn) => fn(state));
        }
    }

    wait() {
        return this.promise;
    }

    onStateChange(cb: LazyScript["listeners"][0]) {
        this.listeners.push(cb);
        return () => {
            const index = this.listeners.indexOf(cb);
            this.listeners.splice(index, 1);
        };
    }

    lazy = (cb?: (arg: T) => any): void => {
        this.promise.then(cb);
    };

    unblock() {
        if (this.state === "blocked") {
            this.setState("pending");
            return;
        }

        if (this.state === "waiting-unblock") {
            this.setState("pending");
            this.now();
            return;
        }
    }

    static unblockAll() {
        LazyScript.all.forEach((script) => script.unblock());
    }

    now = (cb?: (arg: T) => any): void => {
        if (cb) {
            this.promise.then(cb);
        }

        if (this.state === "blocked") {
            this.setState("waiting-unblock");
            return;
        }

        if (this.state !== "pending") {
            // eg. is "loading" or "ready" meaning .now() has been called
            // earlier and this.promise will resolve without doing anything
            // anymore
            return;
        }

        this.setState("loading");
        this.loadScript().then(() => {
            this.resolve();
        });
    };

    private loadScript() {
        let el = document.createElement("script");
        el.async = true;
        el.dataset.lazyScript = this.options.name;
        el.src = this.options.src;
        const newScript = this.options.mutateScript?.(el);

        if (newScript instanceof HTMLScriptElement) {
            el = newScript;
        }

        this.el = el;

        return new Promise((resolve) => {
            el.onload = resolve;
            document.head.appendChild(el);
            this.options.onScriptAdded?.(el);
        });
    }

    unblockFromGlobal() {
        if (!this.options.blocked) {
            return;
        }

        if (typeof window === "undefined") {
            return;
        }

        if (!window.LazyScriptUnblock) {
            window.LazyScriptUnblock = [];
        }

        trackGlobal(window.LazyScriptUnblock);

        window.LazyScriptUnblock.forEach((name) => {
            if (this.name === name) {
                this.unblock();
            }
        });
    }
}

function trackGlobal(arr: string[] & { lazyScriptTracked?: true }) {
    if (arr.lazyScriptTracked) {
        return;
    }

    arr.lazyScriptTracked = true;

    const origPush = arr.push;

    arr.push = (...names: string[]) => {
        LazyScript.all.forEach((script) => {
            names.forEach((name) => {
                if (script.name === name) {
                    script.unblock();
                }
            });
        });

        return origPush.apply(arr, names);
    };
}
