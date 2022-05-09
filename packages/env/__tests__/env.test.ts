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

() => {
    const env = new TypedEnv<"FOO">({});
    const value = env.get("FOO");
    assertNotAny(value);
    const str: string = value;

    assertType(value);

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
