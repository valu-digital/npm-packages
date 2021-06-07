import { proxy } from "valtio";
import { sync } from "../src";

const wait = (t: number) => new Promise((r) => setTimeout(r, t));

beforeEach(() => {
    history.replaceState(undefined, "", "/");
});

test("can sync to location", async () => {
    const state = proxy({ foo: "" });

    const { start } = sync(state, { debounceTime: 1 });

    start();

    state.foo = "change";

    await wait(100);

    const url = new URL(location.toString());
    expect(url.searchParams.get("data")).toMatchInlineSnapshot(
        `"{\\"foo\\":\\"change\\"}"`,
    );
});

test("can customize sync", async () => {
    const state = proxy({ foo: "" });

    const { start } = sync(state, {
        debounceTime: 1,

        writeURL(state, url) {
            url.searchParams.set("foo", state.foo);
        },
        readURL(url) {
            return {
                foo: url.searchParams.get("foo") ?? "",
            };
        },
    });

    start();

    state.foo = "change";

    await wait(100);

    const url = new URL(location.toString());
    expect(url.searchParams.get("foo")).toEqual("change");
});

test("can init with state", async () => {
    history.replaceState(undefined, "", "/?foo=initial");

    const state = proxy({ foo: "" });

    const { start } = sync(state, {
        debounceTime: 1,

        writeURL(state, url) {
            url.searchParams.set("foo", state.foo);
        },
        readURL(url) {
            return {
                foo: url.searchParams.get("foo") ?? "",
            };
        },
    });

    start();

    expect(state.foo).toEqual("initial");
});

test("can spy replaceState", async () => {
    const state = proxy({ foo: "" });

    const { start } = sync(state, {
        debounceTime: 1,

        writeURL(state, url) {
            url.searchParams.set("foo", state.foo);
        },
        readURL(url) {
            return {
                foo: url.searchParams.get("foo") ?? "",
            };
        },
    });

    start();

    history.replaceState(undefined, "", "/?foo=replace-change");

    expect(state.foo).toEqual("replace-change");
});

test("can spy pushState", async () => {
    const state = proxy({ foo: "" });

    const { start } = sync(state, {
        debounceTime: 1,

        writeURL(state, url) {
            url.searchParams.set("foo", state.foo);
        },
        readURL(url) {
            return {
                foo: url.searchParams.get("foo") ?? "",
            };
        },
    });

    start();

    history.pushState(undefined, "", "/?foo=replace-change");

    expect(state.foo).toEqual("replace-change");
});

test("can stop syncing", async () => {
    const state = proxy({ foo: "" });

    const { start, stop } = sync(state, {
        debounceTime: 1,

        writeURL(state, url) {
            url.searchParams.set("foo", state.foo);
        },
        readURL(url) {
            return {
                foo: url.searchParams.get("foo") ?? "",
            };
        },
    });

    start();

    history.pushState(undefined, "", "/?foo=replace-change");

    expect(state.foo).toEqual("replace-change");

    stop();

    history.pushState(undefined, "", "/?foo=next");
    history.replaceState(undefined, "", "/?foo=next");

    expect(state.foo).toEqual("replace-change");

    state.foo = "This change should not sync to location";

    await wait(100);

    const url = new URL(location.toString());
    expect(url.searchParams.get("foo")).toEqual("next");
});
