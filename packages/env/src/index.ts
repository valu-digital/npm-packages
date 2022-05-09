export class TypedEnv<EnvKey extends string = ""> {
    env: Record<string, string | undefined>;

    constructor(env: Record<string, string | undefined>) {
        this.env = env;
    }

    get(key: EnvKey): string;
    get<F>(key: EnvKey, fallback: F): string | F;
    get(key: EnvKey, fallback?: string): string {
        const value = this.env[key] ?? fallback;

        if (value === undefined) {
            const error = new Error(`Env ${key} is not defined`);
            const stack = error.stack?.split("\n");

            if (stack) {
                // https://kentcdodds.com/blog/improve-test-error-messages-of-your-abstractions
                error.stack = [stack[0]].concat(stack.slice(2)).join("\n");
            }

            throw error;
        }

        return value;
    }

    set(key: EnvKey, value: string) {
        this.env[key] = value;
    }

    delete(key: EnvKey) {
        delete this.env[key];
    }
}
