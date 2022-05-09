export class TypedEnv<EnvKey extends string = ""> {
    env: Record<string, string | undefined>;

    constructor(env: Record<string, string | undefined>) {
        this.env = env;
    }

    get(key: EnvKey): string;
    get<F>(key: EnvKey, fallback: F): string | F;
    get(...args: [key: EnvKey, fallback?: any]): any {
        const [key, fallback] = args;

        const value = this.env[key];

        if (value === undefined && args.length === 1) {
            const error = new Error(`Env ${key} is not defined`);
            const stack = error.stack?.split("\n");

            if (stack) {
                // https://kentcdodds.com/blog/improve-test-error-messages-of-your-abstractions
                error.stack = [stack[0]].concat(stack.slice(2)).join("\n");
            }

            throw error;
        }

        return value ?? fallback;
    }

    set(key: EnvKey, value: string) {
        this.env[key] = value;
    }

    delete(key: EnvKey) {
        delete this.env[key];
    }
}
