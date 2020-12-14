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
    resolve = () => {};

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

    lazy = () => {
        return this.promise;
    };

    now = () => {
        if (this.state !== "pending") {
            return this.promise;
        }

        this.state = "loading";
        this.listeners.forEach((fn) => fn("loading"));

        return loadScript(this.scriptURL).then(() => {
            this.resolve();
            return this.promise;
        });
    };
}
