import { LazyScript } from "../src/lazy-script";

jest.setTimeout(200);

const wait = (t: number) => new Promise((r) => setTimeout(r, t));

// Clear the added scripts for each test
beforeEach(() => {
    // This might be brittle.
    // See: https://github.com/facebook/jest/issues/1224
    document.body.innerHTML = "";
    document.head.innerHTML = "";

    // @ts-ignore
    delete window.LazyScriptUnblock;
});

// Simulate loads events to all added script tags
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mut) => {
        mut.addedNodes.forEach((node) => {
            if (node instanceof HTMLScriptElement) {
                setTimeout(() => {
                    node.dispatchEvent(new Event("load"));
                }, 5);
            }
        });
    });
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
});

test("test basic script loading states", async () => {
    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
    });

    expect(script.state).toBe("idle");

    script.now();

    expect(script.state).toBe("loading");

    // const el = Array.from(document.getElementsByTagName("script"));

    await script.wait();

    expect(script.state).toBe("ready");
});

test("can initialize when script has been loaded", async () => {
    const initSpy = jest.fn();
    const cbSpy = jest.fn();

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        initialize: async () => {
            initSpy();
            return { initObject: true };
        },
    });

    script.now(cbSpy);

    expect(initSpy).toHaveBeenCalledTimes(0);
    expect(cbSpy).toHaveBeenCalledTimes(0);

    await script.wait();

    expect(cbSpy).toHaveBeenCalledWith({ initObject: true });

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(cbSpy).toHaveBeenCalledTimes(1);
});

test("lazy() is not called without now()", async () => {
    const initSpy = jest.fn();
    const cbSpy = jest.fn();

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        initialize: async () => {
            initSpy();
            return { initObject: true };
        },
    });

    script.lazy(cbSpy);

    await wait(50);

    expect(cbSpy).toHaveBeenCalledTimes(0);
});

test("lazy() is called after now()", async () => {
    const initSpy = jest.fn();
    const cbSpy = jest.fn();

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        initialize: async () => {
            initSpy();
            return { initObject: true };
        },
    });

    script.lazy(cbSpy);

    script.now();

    await script.wait();

    expect(cbSpy).toHaveBeenCalledWith({ initObject: true });
    expect(cbSpy).toHaveBeenCalledTimes(1);
});

test("blocked script is not called on now() until unblock()", async () => {
    const initSpy = jest.fn();
    const cbSpy = jest.fn();

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        blocked: true,
        initialize: async () => {
            initSpy();
            return { initObject: true };
        },
    });

    script.now(cbSpy);
    expect(script.state).toBe("waiting-unblock");

    await wait(10);

    expect(cbSpy).toHaveBeenCalledTimes(0);

    script.unblock();

    await script.wait();

    expect(cbSpy).toHaveBeenCalledWith({ initObject: true });
    expect(cbSpy).toHaveBeenCalledTimes(1);
});

test("unblocking does not execute lazy() calls until now()", async () => {
    const initSpy = jest.fn();
    const cbSpy = jest.fn();

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        blocked: true,
        initialize: async () => {
            initSpy();
            return { initObject: true };
        },
    });

    script.lazy(cbSpy);

    script.unblock();

    await wait(10);

    expect(cbSpy).toHaveBeenCalledTimes(0);
    expect(initSpy).toHaveBeenCalledTimes(0);

    script.now();
    await script.wait();

    expect(cbSpy).toHaveBeenCalledWith({ initObject: true });
    expect(cbSpy).toHaveBeenCalledTimes(1);
});

test(".el is created after now()", async () => {
    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
    });

    expect(script.el).toBeUndefined();

    script.now();
    expect(script.el).toBeInstanceOf(HTMLScriptElement);
    await script.wait();
});

test("script element can be muated", async () => {
    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        mutateScript: (el) => {
            el.dataset.testChange = "yes";
        },
    });

    expect(script.el).toBeUndefined();

    script.now();

    expect(script.el?.dataset.testChange).toEqual("yes");

    await script.wait();
});

test("callbacks are are called only once", async () => {
    const nowSpy = jest.fn();
    const lazySpy = jest.fn();

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
    });

    script.lazy(lazySpy);
    script.now(nowSpy);

    await script.wait();

    expect(nowSpy).toHaveBeenCalledTimes(1);
    expect(lazySpy).toHaveBeenCalledTimes(1);

    script.now();

    await script.wait();

    expect(nowSpy).toHaveBeenCalledTimes(1);
    expect(lazySpy).toHaveBeenCalledTimes(1);
});

test("can unblock using predefined global", async () => {
    window.LazyScriptUnblock = ["test"];

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        blocked: true,
    });
    expect(script.state).toBe("idle");

    script.now();

    await script.wait();
});

test("can unblock using predefined global lazily", async () => {
    window.LazyScriptUnblock = [];

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        blocked: true,
    });

    script.now();

    window.LazyScriptUnblock.push("test");
    expect(script.state).toBe("loading");

    await script.wait();
});

test("does not unblock from unmatching predefined globals", async () => {
    window.LazyScriptUnblock = ["other"];

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        blocked: true,
    });
    expect(script.state).toBe("blocked");

    script.now();
    expect(script.state).toBe("waiting-unblock");
});

test("does not unblock from unmatching global push", async () => {
    window.LazyScriptUnblock = [];

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        blocked: true,
    });

    script.now();
    window.LazyScriptUnblock.push("other");
    expect(script.state).toBe("waiting-unblock");
});

test("can track state changes", async () => {
    let state = "";

    const script = new LazyScript({
        name: "test",
        src: "http://test.invalid/foo.js",
        blocked: true,
    });

    script.onStateChange(() => {
        state = script.state;
    });

    script.now();

    expect(state).toBe("waiting-unblock");

    script.unblock();

    expect(state).toBe("loading");

    await script.wait();

    expect(state).toBe("ready");
});
