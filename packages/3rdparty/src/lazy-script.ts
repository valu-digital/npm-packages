declare global {
    interface Window {
        LSU?: string[] & { lazyScriptTracked?: true };
    }
}

export interface LazyScriptOptions<T> {
    id?: string;
    name: string;
    src: string;
    blocked?: boolean;
    initialize?: () => Promise<T> | T;
    mutate?: (script: HTMLScriptElement) => any;
}

export class LazyScript<T = any> {
    private resolve = (arg?: unknown) => {};

    private readonly loadPromise: Promise<T>;

    state: "idle" | "blocked" | "waiting-unblock" | "loading" | "ready";

    name: string;

    private options: LazyScriptOptions<T>;

    listeners: ((state: LazyScript["state"]) => any)[];

    static all = [] as LazyScript[];

    el?: HTMLScriptElement;

    initializedObject?: T;

    static blockingEnabled = true;

    constructor(options: LazyScriptOptions<T>) {
        LazyScript.all.push(this);
        this.name = options.name;
        this.options = options;

        if (options.blocked && LazyScript.blockingEnabled) {
            this.state = "blocked";
        } else {
            this.state = "idle";
        }

        this.listeners = [];
        this.loadPromise = new Promise((resolve) => {
            this.resolve = resolve;
        })
            .then(options.initialize)
            .then((obj) => {
                this.initializedObject = obj;
                this.setState("ready");
                return obj;
            });

        trackGlobal();
        this.unblockFromGlobal();
    }

    private setState(state: LazyScript["state"]) {
        if (this.state !== state) {
            this.state = state;
            this.listeners.forEach((fn) => fn(state));
        }
    }

    /**
     * Return promise which resolves when the script loads.
     *
     * Lazy by default but can trigger immediately with {now: true}
     */
    promise(options?: { now?: boolean }) {
        if (options?.now === true) {
            this.now();
        }

        return this.loadPromise;
    }

    onStateChange(cb: LazyScript["listeners"][0]) {
        this.listeners.push(cb);
        return () => {
            const index = this.listeners.indexOf(cb);
            this.listeners.splice(index, 1);
        };
    }

    isBlocked() {
        if (!LazyScript.blockingEnabled) {
            return false;
        }

        return this.state === "blocked" || this.state === "waiting-unblock";
    }

    unblock() {
        if (this.state === "blocked") {
            this.setState("idle");
            return;
        }

        // .now() was called earlier but it failed because the script was
        // blocked. Turn it to idle and retry .now()
        if (this.state === "waiting-unblock") {
            this.setState("idle");
            this.now();
            return;
        }
    }

    static disableAllBlocking() {
        LazyScript.blockingEnabled = false;
        LazyScript.all.forEach((script) => script.unblock());
    }

    lazy = (cb: (arg: T) => any): void => {
        // Call syncronously if the script has been loaded earlier
        if (this.initializedObject && this.state === "ready") {
            return cb(this.initializedObject);
        }

        // otherwise scedule the callback to be called when the script finally
        // loads
        this.loadPromise.then(cb);
    };

    now = (cb?: (arg: T) => any): void => {
        if (cb) {
            this.lazy(cb);
        }

        if (this.state === "blocked") {
            // Must call .unblock() to continue...
            this.setState("waiting-unblock");
            return;
        }

        if (this.state !== "idle") {
            // We can start loading only from the idle state. In idle it's not
            // blocked or already started loading
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

        if (this.options.id) {
            el.id = this.options.id;
        }

        const newScript = this.options.mutate?.(el);

        if (newScript instanceof HTMLScriptElement) {
            el = newScript;
        }

        this.el = el;

        return new Promise((resolve) => {
            el.onload = resolve;
            document.head.appendChild(el);
        });
    }

    unblockFromGlobal() {
        if (!this.isBlocked()) {
            return;
        }

        if (typeof window === "undefined") {
            return;
        }

        window.LSU?.forEach((name) => {
            if (this.name === name) {
                this.unblock();
            }
        });
    }
}

function trackGlobal() {
    if (typeof window === "undefined") {
        return;
    }

    if (window.LSU?.lazyScriptTracked) {
        return;
    }

    if (!window.LSU) {
        window.LSU = [];
    }

    const arr = window.LSU;

    arr.lazyScriptTracked = true;

    const origPush = arr.push;

    arr.push = (...names: string[]) => {
        const ret = origPush.apply(arr, names);

        // Unblock all matching scripts when new global unblock has been added
        LazyScript.all.forEach((script) => {
            script.unblockFromGlobal();
        });

        return ret;
    };
}
