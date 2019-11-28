import React, { useState } from "react";

import {
    render,
    waitForElementToBeRemoved,
    fireEvent,
} from "@testing-library/react";
import { createAsyncHook } from "../src";

test("can show loading and content", async () => {
    async function doAsync() {
        return "async-result";
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res) {
            return {
                foo: res,
            };
        },
    });

    function Component() {
        const res = useAsync({});

        return (
            <div data-testid="content">
                {res.loading && "loading"}
                {!res.loading && res.state.foo}
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result");
});

test("can use fetcher args", async () => {
    async function doAsync(arg: string) {
        return "async-result:" + arg;
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res) {
            return {
                foo: res,
            };
        },
    });

    function Component() {
        const res = useAsync({ variables: "testarg" });

        return (
            <div data-testid="content">
                {res.loading && "loading"}
                {!res.loading && res.state.foo}
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result:testarg");
});

test("can use variables in update", async () => {
    async function doAsync(arg: string) {
        return "async-result:" + arg;
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res, meta) {
            return {
                foo: "fromupdate:" + meta.variables,
            };
        },
    });

    function Component() {
        const res = useAsync({ variables: "testarg" });

        return (
            <div data-testid="content">
                {res.loading && "loading"}
                {!res.loading && res.state.foo}
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("fromupdate:testarg");
});

test("variables change triggers fetch", async () => {
    const fetcherSpy = jest.fn();
    const metaSpy = jest.fn();
    async function doAsync(arg: string) {
        fetcherSpy();
        return "async-result:" + arg;
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res, meta) {
            metaSpy(meta);
            return {
                foo: res,
            };
        },
    });

    function Component() {
        const [state, setState] = React.useState("first");
        const res = useAsync({ variables: state });

        return (
            <div>
                <button
                    data-testid="button"
                    onClick={() => {
                        setState("second");
                    }}
                >
                    click
                </button>
                <div data-testid="content">
                    {res.loading && "loading"}
                    {!res.loading && res.state.foo}
                </div>
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result:first");

    expect(fetcherSpy).toHaveBeenCalledTimes(1);
    fireEvent(
        getByTestId("button"),
        new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        }),
    );

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result:second");
    expect(fetcherSpy).toHaveBeenCalledTimes(2);

    // Assert previous variables
    expect(metaSpy).toHaveBeenCalledTimes(2);
    expect(metaSpy.mock.calls[1][0]).toMatchObject({
        previousVariables: "first",
        variables: "second",
    });
});

test("variables are checked deeply", async () => {
    const spy = jest.fn();
    async function doAsync(variables: {
        deep: {
            value: string;
        };
    }) {
        spy();
        return "async-result:" + variables.deep.value;
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res, meta) {
            return {
                foo: res,
            };
        },
    });

    function Component() {
        const [state, setState] = React.useState({
            deep: {
                value: "value",
            },
        });

        const res = useAsync({ variables: state });

        return (
            <div>
                <button
                    data-testid="button"
                    onClick={() => {
                        // Deeply the same value
                        setState({
                            deep: {
                                value: "value",
                            },
                        });
                    }}
                >
                    click
                </button>
                <div data-testid="content">
                    {res.loading && "loading"}
                    {!res.loading && res.state.foo}
                </div>
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result:value");

    expect(spy).toHaveBeenCalledTimes(1);

    fireEvent(
        getByTestId("button"),
        new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        }),
    );

    expect(getByTestId("content").innerHTML).toEqual("async-result:value");
    expect(spy).toHaveBeenCalledTimes(1);
});

test("can use previous state", async () => {
    const spy = jest.fn();
    async function doAsync(arg: string) {
        spy();
        return ["res", arg];
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: [] as string[],
        },
        update(state, res, meta) {
            return {
                foo: state.foo.concat(res),
            };
        },
    });

    function Component() {
        const [state, setState] = React.useState("first");
        const res = useAsync({ variables: state });

        return (
            <div>
                <button
                    data-testid="button"
                    onClick={() => {
                        setState("second");
                    }}
                >
                    click
                </button>
                <div data-testid="content">
                    {res.loading && "loading"}
                    {!res.loading && res.state.foo.join(",")}
                </div>
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("res,first");

    expect(spy).toHaveBeenCalledTimes(1);
    fireEvent(
        getByTestId("button"),
        new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        }),
    );

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("res,first,res,second");
    expect(spy).toHaveBeenCalledTimes(2);
});
