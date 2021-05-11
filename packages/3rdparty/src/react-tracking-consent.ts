import { useEffect, useState } from "react";
import type { TrackingConsent } from "./tracking-consent";

export function useTrackingConsent(
    tc: TrackingConsent,
    initial?: TrackingConsent["response"]["status"],
): TrackingConsent["response"]["status"] {
    // Start with the "not-given" status...
    const [state, setState] = useState<TrackingConsent["response"]["status"]>(
        initial ?? "not-given",
    );

    useEffect(() => {
        // ...and only in the first mount read the actual status to avoid React SSR
        // hydration issues
        setState(tc.response.status);

        // Event is always emitted when the reponses changes. This will be
        // emitted on other events too but React can detect the change from the
        // string and avoid useless rendering automatically
        return tc.onEvent(() => {
            setState(tc.response.status);
        });
    }, [tc]);

    return state;
}
