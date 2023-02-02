/**
 * Assertion function with fixable stack for better error messages
 */
export function assert(cond: boolean, message: string, offsetStack?: number) {
    if (!cond) {
        const error = new Error(message);
        const stack = error.stack;

        if (stack && offsetStack) {
            // https://kentcdodds.com/blog/improve-test-error-messages-of-your-abstractions

            const lines = stack.trim().split("\n");

            const errorMessage: string[] = [];
            const stackLines: string[] = [];
            for (const line of lines) {
                // Strack trace lines starts with " at "
                if (/^\s*at /.test(line)) {
                    stackLines.push(line);
                } else {
                    errorMessage.push(line);
                }
            }

            error.stack = errorMessage
                .concat(stackLines.slice(offsetStack ?? 1))
                .join("\n");
        }

        throw error;
    }
}

/**
 * Given object is null or undefined
 */
export function isNil(ob: any): ob is null | undefined {
    return ob === null || ob === undefined;
}

/**
 * Given object is NOT null or undefined
 */
export function notNil<T>(ob: T): ob is Exclude<T, undefined | null> {
    return ob !== null && ob !== undefined;
}

/**
 * Asserts that given object is not false, null or undefined
 */
export function assertNotNil<T>(
    ob: T,
    msg?: string,
): asserts ob is Exclude<T, undefined | null> {
    if (!msg) {
        msg = `Unexpected ${_stringify(ob)}`;
    }

    assert(!isNil(ob), `[@valu/assert notNil] ${msg}`, 2);
}

export function is<T>(ob: any, value: T): ob is T {
    return ob === value;
}

export function assertIs<T>(ob: any, value: T, msg?: string): asserts ob is T {
    if (!msg) {
        msg = `${_stringify(ob)} !== ${_stringify(value)}`;
    }

    assert(is(ob, value), `[@valu/assert Value] ${msg}`, 2);
}

function _stringify(ob: any) {
    if (ob === null) {
        return "null";
    }

    return String(ob);
}

export function assertNotBrowser() {
    assert(
        typeof window === "undefined",
        "This code is not allowed in the browser",
        2,
    );
}

/**
 * Asserts that the given value is not any type
 */
export function assertNotAny<T>(value: NotAny<T>) {}

type IsAny<T> = unknown extends T ? (T extends {} ? T : never) : never;
type NotAny<T> = T extends IsAny<T> ? never : T;

/**
 * Assert that the type of the `value` is assignable to the type T
 */
export function assertType<T>(value: T) {}
