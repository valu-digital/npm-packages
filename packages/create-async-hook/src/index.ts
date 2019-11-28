import React from "react";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export function createAsyncHook<
    Fn extends (...args: any[]) => Promise<any>,
    State
>(
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
    variables?: Parameters<Fn>[0],
) => {
    loading: boolean;
    state: State;
} {
    return function useAsyncState(_variables: Parameters<Fn>[0]) {
        const refresh = React.useCallback(() => {
            setState(s => {
                console.log(s.key);
                return {
                    ...s,
                    key: s.key + 1,
                };
            });
        }, []);

        const [state, setState] = React.useState({
            loading: true,
            variables: _variables,
            key: 0,
            state: options.initialState,
            refresh,
        });

        const memoVariables = React.useMemo(
            () => _variables,
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [JSON.stringify(_variables)],
        );

        React.useEffect(
            () => {
                setState(prev => {
                    if (prev.loading) {
                        return prev;
                    }

                    return {
                        ...prev,
                        loading: true,
                    };
                });

                fetcher(memoVariables).then((res: any) => {
                    setState(prevState => ({
                        ...prevState,
                        variables: memoVariables,
                        state: options.update(prevState.state, res, {
                            refreshed: state.variables === memoVariables,
                            previousVariables: state.variables,
                            variables: memoVariables,
                        }),

                        loading: false,
                    }));
                });
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [memoVariables, state.key],
        );

        return state;
    };
}
