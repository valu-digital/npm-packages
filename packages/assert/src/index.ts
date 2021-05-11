/**
 * Assertion function with fixable stack for better error messages
 */
function assert(cond: boolean, message: string, offsetStack?: number) {
    if (!cond) {
        const error = new Error(message);
        const stack = error.stack?.split("\n");

        if (stack) {
            // https://kentcdodds.com/blog/improve-test-error-messages-of-your-abstractions
            error.stack = [stack[0]]
                .concat(stack.slice(1 + (offsetStack ?? 1)))
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
        msg = `Unexpeted ${_stringify(ob)}`;
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
