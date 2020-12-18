export interface LazyScriptOptions<T> {
    src: string;
    initialize: () => Promise<T> | T;
    mutateScript?: (script: HTMLScriptElement) => any;
    onScriptAdded?: (script: HTMLScriptElement) => any;
}

export class LazyScript<T = any> {
    private resolve = (arg?: unknown) => {};

    private readonly promise: Promise<T>;

    state: "pending" | "loading" | "ready";

    options: LazyScriptOptions<T>;

    listeners: ((state: "loading" | "ready") => any)[];

    constructor(options: LazyScriptOptions<T>) {
        this.options = options;
        this.state = "pending";
        this.listeners = [];
        this.promise = new Promise((resolve) => {
            this.resolve = resolve;
        })
            .then(options.initialize)
            .then((res) => {
                this.state = "ready";
                this.listeners.forEach((fn) => fn("ready"));
                return res;
            });
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

    now = (cb?: (arg: T) => any): void => {
        this.promise.then(cb);

        if (this.state !== "pending") {
            // eg. is "loading" or "ready" meaning .now() has been called
            // earlier and this.promise will resolve without doing anything
            // anymore
            return;
        }

        this.state = "loading";
        this.listeners.forEach((fn) => fn("loading"));

        this.loadScript().then(() => {
            this.resolve();
        });
    };

    private loadScript() {
        return new Promise((resolve) => {
            let script = document.createElement("script");
            script.onload = resolve;
            script.async = true;
            script.src = this.options.src;
            const newScript = this.options.mutateScript?.(script);

            if (newScript instanceof HTMLScriptElement) {
                script = newScript;
            }

            document.head.appendChild(script);
            this.options.onScriptAdded?.(script);
        });
    }
}
