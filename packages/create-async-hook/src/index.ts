import React from "react";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * From SO, must be perfect?
 * https://stackoverflow.com/a/25456134/153718
 */
function deepEqual(x: any, y: any) {
    if (x === y) {
        return true;
    } else if (
        typeof x == "object" &&
        x != null &&
        typeof y == "object" &&
        y != null
    ) {
        if (Object.keys(x).length != Object.keys(y).length) return false;

        for (var prop in x) {
            if (y.hasOwnProperty(prop)) {
                if (!deepEqual(x[prop], y[prop])) return false;
            } else return false;
        }

        return true;
    } else return false;
}

function useDeepEqualRef<T>(o: T): T {
    const ref = React.useRef<T>();

    if (!deepEqual(o, ref.current)) {
        ref.current = o;
    }

    return ref.current ?? o;
}

export function createAsyncHook<Fn extends (args?: any) => Promise<any>, State>(
    fetcher: Fn,
    options: {
        initialState: State;
        update: (
            state: State,
            res: UnwrapPromise<ReturnType<Fn>>,
            meta: {
                refreshed: boolean;
                variables: Parameters<Fn>[0];
                previousVariables: Parameters<Fn>[0];
            },
        ) => State;
    },
): (
    variables: Parameters<Fn> extends []
        ? {} | undefined
        : { variables: Parameters<Fn>[0] },
) => {
    loading: boolean;
    state: State;
} {
    return function useAsyncState(runtimeOptions: {
        variables: Parameters<Fn>[0];
    }) {
        const refresh = React.useCallback(() => {
            setState(s => {
                return {
                    ...s,
                    key: s.key + 1,
                };
            });
        }, []);

        const refVariables = useDeepEqualRef(runtimeOptions.variables ?? []);

        const [state, setState] = React.useState({
            loading: true,
            variables: refVariables,
            key: 0,
            state: options.initialState,
            refresh,
        });

        React.useEffect(() => {
            setState(prev => {
                if (prev.loading) {
                    return prev;
                }

                return {
                    ...prev,
                    loading: true,
                };
            });

            fetcher(refVariables).then((res: any) => {
                setState(prevState => ({
                    ...prevState,
                    variables: refVariables,
                    state: options.update(prevState.state, res, {
                        refreshed: state.variables === refVariables,
                        previousVariables: state.variables,
                        variables: refVariables,
                    }),

                    loading: false,
                }));
            });
        }, [refVariables, state.key]);

        return state;
    } as any;
}
