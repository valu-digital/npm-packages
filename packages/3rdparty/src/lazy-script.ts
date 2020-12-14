export function loadScript(url: string) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.onload = resolve;
        script.async = true;
        script.src = url;
        document.head.appendChild(script);
    });
}

export class LazyScript<T = any> {
    private resolve = (arg?: unknown) => {};

    private readonly promise: Promise<T>;

    state: "pending" | "loading" | "ready";

    scriptURL: string;

    listeners: ((state: "loading" | "ready") => any)[];

    constructor(options: { url: string; initialize: () => Promise<T> | T }) {
        this.state = "pending";
        this.listeners = [];
        this.scriptURL = options.url;
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
        if (this.state !== "pending") {
            this.promise.then(cb);
            return;
        }

        this.state = "loading";
        this.listeners.forEach((fn) => fn("loading"));

        loadScript(this.scriptURL).then(() => {
            this.resolve();
            this.promise.then(cb);
            return;
        });
    };
}
