import { useEffect, useState } from "react";
import type { LazyScript } from "./lazy-script";

export function useLazyScript(script: LazyScript<any>): LazyScript["state"] {
    const [state, setState] = useState<LazyScript["state"]>(script.state);

    useEffect(() => {
        return script.onStateChange((newState) => {
            setState(newState);
        });
    }, [script]);

    return state;
}
