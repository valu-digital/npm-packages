import { assertNotAny, assertType } from "@valu/assert";
import { test, expect } from "vitest";
import { TypedEnv } from "../src";

test("can get value", () => {
    const raw: Record<string, string> = { FOO: "bar" };
    const env = new TypedEnv<"FOO">(raw);
    expect(env.get("FOO")).toEqual("bar");
});

test("can set value", () => {
    const raw: Record<string, string> = { FOO: "bar" };
    const env = new TypedEnv<"FOO">(raw);
    env.set("FOO", "baz");
    expect(env.get("FOO")).toEqual("baz");
    expect(raw.FOO).toEqual("baz");
});

test("can delete value", () => {
    const raw: Record<string, string> = { FOO: "bar" };
    const env = new TypedEnv<"FOO">(raw);
    env.delete("FOO");
    expect(env.get("FOO", null)).toEqual(null);
    expect(raw.FOO).toEqual(undefined);
});

test("throws on missing value", () => {
    const raw: Record<string, string> = {};
    const env = new TypedEnv<"FOO">(raw);
    expect(() => env.get("FOO")).toThrowError("Env FOO is not defined");
});

test("stack trace is offsetted to call site", () => {
    const raw: Record<string, string> = {};
    const env = new TypedEnv<"FOO">(raw);
    let error: Error | undefined;
    try {
        env.get("FOO");
    } catch (_error: any) {
        error = _error;
    }

    if (!error) {
        throw "error not thrown";
    }

    expect(error.stack?.split("\n")[1]).toMatch(
        /at .+\/env.test.ts:[0-9]+:[0-9]+/,
    );
});

test("can fallback to default", () => {
    const raw: Record<string, string> = {};
    const env = new TypedEnv<"FOO">(raw);
    expect(env.get("FOO", "default")).toEqual("default");
});

test("can fallback with undefined", () => {
    const raw: Record<string, string> = {};
    const env = new TypedEnv<"FOO">(raw);

    expect(env.get("FOO", undefined)).toEqual(undefined);
    const ret = env.get("FOO", undefined);
    assertType<string | undefined>(ret);

    // @ts-expect-error
    assertType<string>(ret);
});

test("can create env", () => {
    const env = new TypedEnv<"FOO" | "BAR">({});
    const values = env.createEnv({ BAR: "value" });
    expect(values).toEqual({ BAR: "value" });
});

() => {
    const env = new TypedEnv<"FOO">({});
    const value = env.get("FOO");
    assertNotAny(value);
    const str: string = value;

    assertType<string>(value);

    // @ts-expect-error
    const bad: number = value;

    // @ts-expect-error
    env.get("BAD");
    // @ts-expect-error
    env.set("BAD");
    // @ts-expect-error
    env.delete("BAD");
};

() => {
    // custom default type
    const env = new TypedEnv<"FOO">({});
    const value = env.get("FOO", null);
    assertNotAny(value);

    {
        const str: string | null = value;
    }

    {
        // @ts-expect-error
        const str: string = value;
    }
};

() => {
    // create env
    const env = new TypedEnv<"FOO" | "BAR">({});

    const values = env.createEnv({ BAR: "value" });

    const s: string = values.BAR;

    assertNotAny(values.BAR);

    // @ts-expect-error
    values.bad;

    // @ts-expect-error
    values.FOO;

    // @ts-expect-error
    env.createEnv({ bad: "value" });
};
