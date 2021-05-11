import { useEffect, useState } from "react";
import type { LazyScript } from "./lazy-script";

export function useLazyScript(
    script: LazyScript<any>,
    initial?: LazyScript["state"],
): LazyScript["state"] {
    // Start with the "idle" status...
    const [state, setState] = useState<LazyScript["state"]>(initial ?? "idle");

    useEffect(() => {
        // ...and only in the first mount read the actual status to avoid React
        // SSR hydration issues
        setState(script.state);

        return script.onStateChange((newState) => {
            setState(newState);
        });
    }, [script]);

    return state;
}
