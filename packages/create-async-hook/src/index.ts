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
                args: Parameters<Fn>;
                previousArgs: Parameters<Fn>;
            },
        ) => State;
    },
): (
    args: Parameters<Fn> extends [] ? {} | undefined : { args: Parameters<Fn> },
) => {
    loading: boolean;
    state: State;
} {
    return function useAsyncState(runtimeOptions: { args: Parameters<Fn> }) {
        const refresh = React.useCallback(() => {
            setState(s => {
                console.log(s.key);
                return {
                    ...s,
                    key: s.key + 1,
                };
            });
        }, []);

        const runtimeArgs = runtimeOptions.args ?? [];

        const [state, setState] = React.useState({
            loading: true,
            args: runtimeArgs,
            key: 0,
            state: options.initialState,
            refresh,
        });

        const memoArgs = React.useMemo(
            () => runtimeArgs,
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [JSON.stringify(runtimeArgs)],
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

                fetcher(...memoArgs).then((res: any) => {
                    setState(prevState => ({
                        ...prevState,
                        variables: memoArgs,
                        state: options.update(prevState.state, res, {
                            refreshed: state.args === memoArgs,
                            previousArgs: state.args,
                            args: memoArgs,
                        }),

                        loading: false,
                    }));
                });
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [memoArgs, state.key],
        );

        return state;
    } as any;
}
